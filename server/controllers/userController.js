const User = require('../models/User');
const MedicalRecord = require('../models/MedicalRecord');

const updateProfile = async (req, res) => {
  try {
    console.log('Profile update request received:', {
      userId: req.user.id,
      requestBody: req.body
    });
    
    const userId = req.user.id;
    const updates = req.body;

    // Remove email from updates if it exists (email cannot be changed)
    if (updates.email) {
      console.log('Email field removed from updates');
      delete updates.email;
    }

    // Remove password from updates if it exists (password updates handled separately)
    if (updates.password) {
      console.log('Password field removed from updates');
      delete updates.password;
    }
    
    // Remove professional fields for non-admin users
    if (req.user.role !== 'admin') {
      console.log('Removing professional fields for non-admin user');
      delete updates.specialization;
      delete updates.medicalLicenseNumber;
    }

    // Ensure address has all required subfields to avoid schema validation issues
    if (updates.address) {
      const defaultAddress = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };

      // Merge with defaults to ensure all fields exist
      updates.address = {
        ...defaultAddress,
        ...updates.address
      };
      
      console.log('Normalized address object:', updates.address);
    }

    console.log('Updating user with data:', updates);

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      console.log('User not found during profile update');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('Profile update successful for user:', userId);
    
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Error in updateProfile:', error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get user statistics for dashboard
 */
const getUserStats = async (req, res) => {
  try {
    console.log('Received request for user stats. User ID:', req.user?.id);
    
    if (!req.user || !req.user.id) {
      console.error('No user found in request object');
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }
    
    const userId = req.user.id;
    
    // Get the user with their details
    console.log('Fetching user data for ID:', userId);
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.error('User not found with ID:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    console.log('Successfully found user:', user.name);

    // Get total record count for this user
    const totalRecords = await MedicalRecord.countDocuments({ patient: userId });
    
    // Get status counts
    const pendingCount = await MedicalRecord.countDocuments({ 
      patient: userId, 
      status: 'pending' 
    });
    
    const processingCount = await MedicalRecord.countDocuments({ 
      patient: userId, 
      status: 'processing' 
    });
    
    const diagnosedCount = await MedicalRecord.countDocuments({ 
      patient: userId, 
      status: 'diagnosed' 
    });
    
    const reviewedCount = await MedicalRecord.countDocuments({ 
      patient: userId, 
      status: 'reviewed' 
    });
    
    // Get critical records (those with high confidence AI diagnosis)
    const criticalCount = await MedicalRecord.countDocuments({
      patient: userId,
      'diagnosisResults.aiDiagnosis.confidence': { $gt: 85 } // Consider records with >85% confidence as critical
    });
    
    // Get 3 most recent records
    const recentRecords = await MedicalRecord.find({ patient: userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('recordType bodyPart status createdAt diagnosisResults');
    
    // Format recent records for response
    const formattedRecentRecords = recentRecords.map(record => ({
      id: record.id,
      recordType: record.recordType,
      bodyPart: record.bodyPart,
      status: record.status,
      createdAt: record.createdAt,
      aiDiagnosis: record.diagnosisResults?.aiDiagnosis?.condition || null,
      confidence: record.diagnosisResults?.aiDiagnosis?.confidence || 0
    }));
    
    const stats = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
      },
      records: {
        total: totalRecords,
        pending: pendingCount,
        processing: processingCount,
        diagnosed: diagnosedCount,
        reviewed: reviewedCount,
        critical: criticalCount,
        completed: diagnosedCount + reviewedCount // Considering diagnosed and reviewed as completed
      },
      recentRecords: formattedRecentRecords
    };
    
    // Get record type distribution
    const recordTypes = ['xray', 'mri', 'ct', 'ultrasound', 'labTest', 'other'];
    const recordTypeStats = {};
    
    for (const type of recordTypes) {
      const count = await MedicalRecord.countDocuments({
        patient: userId,
        recordType: type
      });
      recordTypeStats[type] = count;
    }
    
    stats.recordTypeDistribution = recordTypeStats;
    
    console.log('Sending stats data:', stats);
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
};

module.exports = {
  updateProfile,
  getUserStats
};