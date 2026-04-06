import { useState, useRef } from "react";
import { Upload, Image as ImageIcon, X, Leaf, AlertTriangle, CheckCircle2, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PredictionData {
  disease: string;
  confidence: number;
  isHealthy: boolean;
}

const CropHealth = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);

  // Handle Image Select
  const handleImageSelect = (file: File | null) => {
    setSelectedFile(file);
    setPrediction(null);

    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Drag & Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleImageSelect(file);
    }
  };

  // Predict (Mock for now)
  // const handlePredict = async () => {
  //   if (!selectedFile) return;

  //   setIsLoading(true);

  //   setTimeout(() => {
  //     const mock = {
  //       disease: "Leaf Blight",
  //       confidence: 91,
  //       isHealthy: false,
  //     };

  //     setPrediction(mock);
  //     setIsLoading(false);
  //   }, 2500);
  // };

  const handlePredict = async () => {
  if (!selectedFile) return;

  setIsLoading(true);

  const formData = new FormData();
  formData.append("image", selectedFile); // 🔥 IMPORTANT FIX

  try {
    const response = await fetch("http://127.0.0.1:5001/predict", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    console.log(data); // 🔍 debug

    setPrediction({
      // disease: data.disease,
      // confidence: data.confidence_score,
      // isHealthy: data.disease.toLowerCase().includes("healthy"),
      disease: data.disease,
      confidence: data.confidence_score, // number
      isHealthy: data.disease.toLowerCase().includes("healthy"),
    });

  } catch (error) {
    console.error("Error:", error);
  }

  setIsLoading(false);
};

  const clearImage = () => {
    handleImageSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getConfidenceColor = (isHealthy: boolean) => {
    return isHealthy ? "bg-success" : "bg-destructive";
  };

  return (
  <div className="container mx-auto px-4 py-8 bg-green-50 min-h-screen">

  {/* 🔹 HEADER */}
  <div className="text-center mb-10">
    <div className="flex items-center justify-center gap-3 mb-4">
      <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center shadow-md">
        <Leaf className="w-6 h-6 text-white" />
      </div>

      <h1 className="text-3xl md:text-4xl font-bold text-green-900">
        Crop Disease Detection
      </h1>
    </div>

    <p className="text-lg text-gray-500 max-w-xl mx-auto">
      Upload a leaf image to detect diseases using AI-powered analysis
    </p>
  </div>

  {/* 🔹 GRID STARTS HERE */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* LEFT SIDE - Upload */}
      <div className="card-elevated bg-white rounded-xl shadow-md p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
            <Upload className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Upload Leaf Image</h2>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
        />

        {!imagePreview ? (
          <div
            className={`border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[250px] cursor-pointer ${
              isDragging ? "border-primary bg-primary/10" : ""
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setIsDragging(false);
            }}
            onDrop={handleDrop}
          >
            <ImageIcon className="w-10 h-10 text-primary mb-3" />
            <p>Drag & drop your leaf image</p>
            <p className="text-sm text-muted-foreground">or click to browse</p>
          </div>
        ) : (
          <div className="relative">
            <img
              src={imagePreview}
              className="w-full h-[250px] object-contain rounded-lg"
            />
            <button
              onClick={clearImage}
              className="absolute top-2 right-2 bg-white p-2 rounded-full shadow"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Button
          onClick={handlePredict}
          disabled={!imagePreview || isLoading}
          className="mt-6"
        >
          {isLoading ? "Analyzing..." : "Predict Disease"}
        </Button>
      </div>

      {/* RIGHT SIDE - Result */}
      <div className="card-elevated bg-white rounded-xl shadow-md p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 flex items-center justify-center rounded-lg">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">Prediction Result</h2>
        </div>

        <div className="flex-1 flex items-center justify-center">
          {isLoading ? (
            <div className="text-center">
              <Leaf className="w-10 h-10 animate-pulse mx-auto mb-2" />
              <p>Analyzing image...</p>
            </div>
          ) : prediction ? (
            <div className="text-center w-full">
              <div className="mb-4">
                {prediction.isHealthy ? (
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                ) : (
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                )}
              </div>

              <h3 className="text-xl font-bold mb-2">
                {prediction.disease}
              </h3>

              <p className="mb-4 text-muted-foreground">
                {prediction.isHealthy
                  ? "Plant is healthy"
                  : "Disease detected"}
              </p>

              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${getConfidenceColor(prediction.isHealthy)} h-3 rounded-full`}
                  style={{ width: `${prediction.confidence}%` }}
                />
              </div>

              <p className="mt-2 font-semibold">
                {prediction.confidence}% Confidence
              </p>
            </div>
          ) : (
            <div className="text-center">
              <Leaf className="w-10 h-10 mx-auto mb-2 text-gray-400" />
              <p>Prediction will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Tips Section */}
       <Card className="gradient-earth shadow-float">
         <CardHeader>
           <CardTitle className="text-foreground">Photography Tips</CardTitle>
         </CardHeader>
         <CardContent className="text-foreground/80">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
             <div>
               <h4 className="font-semibold mb-2">For Best Results:</h4>
               <ul className="space-y-1">
                 <li>• Take photos in good natural light</li>
                 <li>• Focus on affected leaves or parts</li>
                 <li>• Avoid blurry or too distant shots</li>
                 <li>• Include both healthy and diseased areas</li>
               </ul>
             </div>
             <div>
               <h4 className="font-semibold mb-2">बेहतर परिणाम के लिए:</h4>
               <ul className="space-y-1">
                 <li>• अच्छी प्राकृतिक रोशनी में फोटो लें</li>
                 <li>• प्रभावित पत्तियों या भागों पर फोकस करें</li>
                 <li>• धुंधली या बहुत दूर की तस्वीरें न लें</li>
                 <li>• स्वस्थ और रोगग्रस्त दोनों क्षेत्र शामिल करें</li>
               </ul>
             </div>
           </div>
         </CardContent>
       </Card>
  
  </div>
  );
};

export default CropHealth;




// import React, { useState, useRef } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Camera, Upload, Scan} from 'lucide-react';
// import { useLanguage } from '@/contexts/LanguageContext';

// // Type definition for analysis result
// interface AnalysisResult {
//   disease: string;
//   // hindiName: string;
//   confidence: number;
//   severity: string;
//   // description: string;
//   // hindiDescription: string;
//   // treatment: string[];
//   // hindiTreatment: string[];
//   // prevention: string[];
//   // fertilizers: string[];
//   // expectedRecovery: string;
// }

// const CropHealth: React.FC = () => {
//   const { t } = useLanguage();
//   const [selectedImage, setSelectedImage] = useState<string | null>(null);
//   const [isAnalyzing, setIsAnalyzing] = useState(false);
//   const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setSelectedImage(e.target?.result as string);
//         setAnalysisResult(null);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const analyzeImage = async () => {
//     if (!selectedImage) return;
    
//     setIsAnalyzing(true);
    
//     // Simulate AI analysis
//     setTimeout(() => {
//       const mockResult = {
//         disease: 'Leaf Blight',
//         // hindiName: 'पत्ती का झुलसा रोग',
//         confidence: 92,
//         severity: 'Medium'
//       };
      
//       setAnalysisResult(mockResult);
//       setIsAnalyzing(false);
//     }, 3000);
//   };

//   const getSeverityColor = (severity: string) => {
//     switch (severity?.toLowerCase()) {
//       case 'low': return 'text-success';
//       case 'medium': return 'text-warning';
//       case 'high': return 'text-destructive';
//       default: return 'text-muted-foreground';
//     }
//   };

//   const getSeverityBadge = (severity: string) => {
//     switch (severity?.toLowerCase()) {
//       case 'low': return 'bg-success/10 text-success border-success/20';
//       case 'medium': return 'bg-warning/10 text-warning border-warning/20';
//       case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
//       default: return 'bg-muted/10 text-muted-foreground border-muted/20';
//     }
//   };

//   return (
//     <div className="container mx-auto px-4 py-8 space-y-6">
//       {/* Header */}
//       <div className="text-center mb-8">
//         <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
//           {t('Crop Disease Detection', {})}
//         </h1>
//         <p className="text-lg text-muted-foreground">
//           {t('Upload a leaf image to detect diseases using AI-powered analysise', {})}
//         </p>
//       </div>

//       {/* Upload Section */}
//       <Card className="shadow-float">
//         <CardHeader>
//           <CardTitle className="flex items-center space-x-2">
//             <Camera className="h-5 w-5 text-primary" />
//             <span>Upload Leaf Image</span>
//           </CardTitle>
//           <CardDescription>
//             Take a clear photo of the affected crop leaves or upload an existing image
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Image Upload Area */}
//           <div 
//             className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-smooth cursor-pointer"
//             onClick={() => fileInputRef.current?.click()}
//           >
//             {selectedImage ? (
//               <div className="space-y-4">
//                 <img
//                   src={selectedImage}
//                   alt="Uploaded crop"
//                   className="max-w-full max-h-64 mx-auto rounded-lg shadow-float"
//                 />
//                 <p className="text-sm text-muted-foreground">
//                   Image uploaded successfully. Click to change image.
//                 </p>
//               </div>
//             ) : (
//               <div className="space-y-4">
//                 <div className="h-16 w-16 mx-auto bg-accent rounded-full flex items-center justify-center">
//                   <Upload className="h-8 w-8 text-accent-foreground" />
//                 </div>
//                 <div>
//                   <p className="text-foreground font-medium">Drag & drop your leaf image here</p>
//                   <p className="text-sm text-muted-foreground">
//                     or click to browse files
//                   </p>
//                 </div>
//               </div>
//             )}
//           </div>

//           <input
//             ref={fileInputRef}
//             type="file"
//             accept="image/*"
//             onChange={handleImageUpload}
//             className="hidden"
//           />

//           {/* Action Buttons */}
//           <div className="flex flex-col sm:flex-row gap-3">
//             <Button
//               onClick={analyzeImage}
//               disabled={!selectedImage || isAnalyzing}
//               className="gradient-primary hover:shadow-glow transition-smooth"
//             >
//               {isAnalyzing ? (
//                 <>
//                   <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
//                   Analyzing...
//                 </>
//               ) : (
//                 <>
//                   <Scan className="h-4 w-4 mr-2" />
//                   Analyze Crop Health
//                 </>
//               )}
//             </Button>
//             <Button
//               variant="outline"
//               onClick={() => fileInputRef.current?.click()}
//               className="hover:shadow-glow transition-smooth"
//             >
//               <Camera className="h-4 w-4 mr-2" />
//               Take New Photo
//             </Button>
//           </div>
//         </CardContent>
//       </Card>

//       {/* Analysis Results */}
//       {analysisResult && (
//         <div className="space-y-6 animate-bounce-in">
//           {/* Disease Detection Summary */}
//           <Card className="gradient-nature shadow-glow">
//             <CardHeader>
//               <CardTitle className="text-white flex items-center justify-between">
//                 <span>Disease Detected</span>
//                 <Badge className="bg-white/20 text-white">
//                   {analysisResult.confidence}% Confidence
//                 </Badge>
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="text-white">
//               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                 <div>
//                   <h3 className="text-xl font-bold">{analysisResult.disease}</h3>
//                   {/* <p className="text-sm opacity-80">{analysisResult.hindiName}</p> */}
//                 </div>
//                 <div className="text-center">
//                   <div className="text-lg font-semibold">Severity</div>
//                   <Badge className={getSeverityBadge(analysisResult.severity) + ' mt-1'}>
//                     {analysisResult.severity}
//                   </Badge>
//                 </div>
//                 {/* <div className="text-center">
//                   <div className="text-lg font-semibold">Recovery Time</div>
//                   <div className="text-sm opacity-90">{analysisResult.expectedRecovery}</div>
//                 </div> */}
//               </div>
//             </CardContent>
//           </Card>

//         </div>
//       )
//       }

//       {/* Tips Section */}
//       <Card className="gradient-earth shadow-float">
//         <CardHeader>
//           <CardTitle className="text-foreground">Photography Tips</CardTitle>
//         </CardHeader>
//         <CardContent className="text-foreground/80">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
//             <div>
//               <h4 className="font-semibold mb-2">For Best Results:</h4>
//               <ul className="space-y-1">
//                 <li>• Take photos in good natural light</li>
//                 <li>• Focus on affected leaves or parts</li>
//                 <li>• Avoid blurry or too distant shots</li>
//                 <li>• Include both healthy and diseased areas</li>
//               </ul>
//             </div>
//             <div>
//               <h4 className="font-semibold mb-2">बेहतर परिणाम के लिए:</h4>
//               <ul className="space-y-1">
//                 <li>• अच्छी प्राकृतिक रोशनी में फोटो लें</li>
//                 <li>• प्रभावित पत्तियों या भागों पर फोकस करें</li>
//                 <li>• धुंधली या बहुत दूर की तस्वीरें न लें</li>
//                 <li>• स्वस्थ और रोगग्रस्त दोनों क्षेत्र शामिल करें</li>
//               </ul>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default CropHealth;