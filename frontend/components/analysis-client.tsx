"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileImage, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface AnalysisClientProps {
    userRole: string
}

export function AnalysisClient({ userRole }: AnalysisClientProps) {
    const [file, setFile] = useState<File | null>(null)
    const [preview, setPreview] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0]
            setFile(selectedFile)
            setPreview(URL.createObjectURL(selectedFile))
            setResult(null)
            setError(null)
        }
    }

    const handleAnalyze = async () => {
        if (!file) return

        setLoading(true)
        setError(null)

        const formData = new FormData()
        formData.append("file", file)

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
            const res = await fetch(`${apiUrl}/predict/image`, {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                throw new Error("Failed to analyze image")
            }

            const data = await res.json()
            setResult(data)
        } catch (err: any) {
            setError(err.message || "Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    const isPatient = userRole === 'patient' || userRole === 'user';

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">
                        {isPatient ? "Self-Check Scan" : "Medical Image Analysis"}
                    </h2>
                    {isPatient && (
                        <p className="text-muted-foreground mt-1">
                            Upload your scan for a quick AI assessment. Please consult a doctor for official diagnosis.
                        </p>
                    )}
                </div>
                {isPatient && <Badge variant="outline">Patient Mode</Badge>}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Upload Scan</CardTitle>
                        <CardDescription>
                            Upload an X-Ray, MRI, or CT Scan for AI analysis.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg border-muted-foreground/25 hover:border-primary/50 transition-colors">
                            {preview ? (
                                <div className="space-y-4 w-full">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={preview}
                                        alt="Preview"
                                        className="max-h-[400px] w-full object-contain rounded-md"
                                    />
                                    <div className="flex justify-between">
                                        <Button variant="outline" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>
                                            Remove
                                        </Button>
                                        <Button onClick={handleAnalyze} disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {loading ? "Analyzing..." : "Analyze Scan"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4 py-12">
                                    <div className="bg-primary/10 p-4 rounded-full inline-block">
                                        <Upload className="h-8 w-8 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                            Drag and drop your file here, or click to browse
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Supports JPG, PNG, DICOM (Max 10MB)
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="file-upload"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="file-upload">
                                        <Button variant="secondary" className="cursor-pointer" asChild>
                                            <span>Browse Files</span>
                                        </Button>
                                    </label>
                                </div>
                            )}
                        </div>

                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Error</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>

                {result && (
                    <Card className="col-span-3">
                        <CardHeader>
                            <CardTitle>Analysis Results</CardTitle>
                            <CardDescription>
                                AI detection confidence and findings.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            <div className={`p-4 rounded-lg border ${result.prediction.includes("Normal") ? "bg-green-500/10 border-green-500/20" : "bg-red-500/10 border-red-500/20"}`}>
                                <div className="flex items-center gap-3">
                                    {result.prediction.includes("Normal") ? (
                                        <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <AlertCircle className="h-6 w-6 text-red-500" />
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-lg">{result.prediction}</h3>
                                        <p className="text-sm text-muted-foreground">Based on pattern analysis</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Confidence Score</span>
                                    <span className="font-medium">{(result.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <Progress value={result.confidence * 100} className="h-2" />
                            </div>

                            <div className="bg-muted p-4 rounded-md text-sm space-y-2">
                                <p className="font-medium text-muted-foreground uppercase text-xs">Technical Details</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-muted-foreground">Model:</span>
                                    <span>ResNet18 (v1)</span>
                                    <span className="text-muted-foreground">Inference Time:</span>
                                    <span>~0.3s</span>
                                    <span className="text-muted-foreground">Resolution:</span>
                                    <span>224x224 (Resized)</span>
                                </div>
                            </div>

                            {!isPatient && (
                                <div className="pt-4 border-t">
                                    <Button variant="outline" className="w-full">Save to Patient Record</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
