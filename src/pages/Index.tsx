import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Loader2, FileText, XCircle, CheckCircle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Index() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    position: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [filePath, setFilePath] = useState<string>("");
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setUploadedFile(acceptedFiles[0]);
      setUploadStatus('uploading');
      
      try {
        const file = acceptedFiles[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        setFilePath(filePath);
        setUploadStatus('success');
        toast({
          title: "File uploaded successfully",
          description: file.name,
        });

      } catch (error) {
        console.error('Error uploading file:', error);
        setUploadStatus('error');
        toast({
          variant: "destructive",
          title: "Error uploading file",
          description: "Please try again",
        });
      }
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 20 * 1024 * 1024, // 20MB
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filePath) {
      toast({
        variant: "destructive",
        title: "Missing resume",
        description: "Please upload your resume before submitting",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('applications').insert({
        full_name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        resume_path: filePath
      });

      if (error) throw error;

      toast({
        title: "Application submitted successfully",
        description: "We'll get back to you soon!",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        position: "",
      });
      setUploadedFile(null);
      setUploadStatus('idle');
      setFilePath("");

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        variant: "destructive",
        title: "Error submitting application",
        description: "Please try again",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownload = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(filePath);

      if (error) {
        throw error;
      }

      // Create a URL for the downloaded file
      const url = window.URL.createObjectURL(data);
      
      // Create a temporary anchor element and trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.download = filePath.split('/').pop() || 'resume'; // Use the original filename or 'resume' as fallback
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);

      toast({
        title: "File downloaded successfully",
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        variant: "destructive",
        title: "Error downloading file",
        description: "Please try again",
      });
    }
  };

  const renderUploadStatus = () => {
    switch (uploadStatus) {
      case 'uploading':
        return (
          <Alert className="mt-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>Uploading {uploadedFile?.name}...</AlertDescription>
          </Alert>
        );
      case 'success':
        return (
          <Alert className="mt-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <AlertDescription>
              {uploadedFile?.name} uploaded successfully
            </AlertDescription>
          </Alert>
        );
      case 'error':
        return (
          <Alert className="mt-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <AlertDescription>
              Failed to upload {uploadedFile?.name}
            </AlertDescription>
          </Alert>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-montserrat">
      <div className="container max-w-2xl py-12">
        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-black">Join Our Team</h1>
            <p className="text-gray-500">
              We're looking for talented people to help us build the future.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Resume/Portfolio</Label>
                <div
                  {...getRootProps()}
                  className={`mt-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-black bg-gray-50' : 'border-gray-300 hover:border-gray-400'}`}
                >
                  <input {...getInputProps()} />
                  {uploadStatus === 'idle' ? (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        {isDragActive ? "Drop your file here" : "Drag & drop your resume/portfolio here"}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        PDF, DOC, or DOCX (max 20MB)
                      </p>
                    </>
                  ) : (
                    <div className="flex flex-col items-center">
                      <FileText className="h-12 w-12 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">
                        {uploadedFile?.name}
                      </p>
                      {uploadStatus === 'success' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(filePath);
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  )}
                </div>
                {renderUploadStatus()}
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || uploadStatus === 'uploading'}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
