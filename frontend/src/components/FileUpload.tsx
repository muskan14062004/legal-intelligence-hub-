import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { documentService } from '../services/documentService';
import { Document } from '../types';

interface FileUploadProps {
  onUploadSuccess: (doc: Document) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Only PDF documents are currently supported (DOCX support coming soon).');
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB limit.');
      return false;
    }
    setSelectedFile(file);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (validateAndSetFile(file)) {
        uploadFile(file);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (validateAndSetFile(file)) {
        uploadFile(file);
      }
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const uploadedDoc = await documentService.uploadDocument(file, (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        }
      });

      setSelectedFile(null);
      setProgress(100);
      onUploadSuccess(uploadedDoc);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 'An error occurred while uploading and parsing the document.'
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
            : 'border-slate-300 hover:border-blue-400 bg-white hover:bg-slate-50/50'
        } ${isUploading ? 'pointer-events-none opacity-80' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h4 className="font-semibold text-slate-800 text-base">
              Upload Legal Contract or Agreement
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Drag & drop your PDF contract here, or <span className="text-blue-600 font-medium">browse files</span> from your computer
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium pt-2">
            <span>Standard: PDF (Searchable)</span>
            <span>•</span>
            <span>Max Size: 50MB</span>
            <span>•</span>
            <span>Page Preservation Active</span>
          </div>
        </div>

        {/* Upload Progress Bar */}
        {isUploading && (
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex justify-between text-xs text-slate-600 mb-1.5 font-medium">
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                Uploading & Processing PDF Pipeline...
              </span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mt-4 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-800">Upload Issue Detected</p>
              <p className="mt-0.5 text-rose-600">{error}</p>
            </div>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
