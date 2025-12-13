const { logActivityInternal } = require('./activityController');

// @desc    Handle chat message
// @route   POST /api/chat
// @access  Private (or Public if needed, but using Private for now to track user)
const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        const msg = message.toLowerCase();

        let responseText = "I'm still learning! Try asking about 'appointments', 'risk analysis', or 'uploading scans'.";
        let actions = [];

        // Basic Rule-Based Logic
        if (msg.includes('hello') || msg.includes('hi')) {
            responseText = "Hello! I'm your AI Medical Assistant. How can I help you today?";
        }
        else if (msg.includes('appointment') || msg.includes('book') || msg.includes('schedule')) {
            responseText = "You can book an appointment with our specialists directly through the platform.";
            actions.push({ label: "Book Appointment", link: "/appointments" });
        }
        else if (msg.includes('upload') || msg.includes('scan') || msg.includes('x-ray') || msg.includes('mri')) {
            responseText = "To analyze a medical scan, go to the AI Analysis section and upload your image.";
            actions.push({ label: "Go to Analysis", link: "/analysis" });
        }
        else if (msg.includes('risk') || msg.includes('heart') || msg.includes('diabetes')) {
            responseText = "Our Risk Simulator can help assess your health risks based on your vitals.";
            actions.push({ label: "Check Health Risk", link: "/risk" });
        }
        else if (msg.includes('profile') || msg.includes('account')) {
            responseText = "You can manage your personal information and security settings in your profile.";
            actions.push({ label: "View Profile", link: "/profile" });
        }
        else if (msg.includes('prescript') || msg.includes('medication')) {
            responseText = "You can view your prescriptions and medication history in your dashboard.";
            actions.push({ label: "View Prescriptions", link: "/prescriptions" });
        }

        // Optional: Log chat activity if user is logged in
        if (req.user) {
            // We won't await this to keep chat fast
            logActivityInternal(req.user.id, "Used AI Chatbot", "chat", { message_length: message.length });
        }

        res.json({
            response: responseText,
            actions: actions,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Chat Error:", error);
        res.status(500).json({ message: 'AI is currently unavailable.' });
    }
};

module.exports = {
    handleChat
};
