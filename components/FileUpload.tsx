
import React, { useCallback, useState } from 'react';
import { UploadIcon, WarningIcon } from './Icons';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  disabled: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      const allowedTypes = [
        'text/csv', 
        'text/plain',
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
      ];
      
      const invalidFiles = fileArray.filter(file => !allowedTypes.includes(file.type));

      if (invalidFiles.length > 0) {
        setError(`Error: Archivos con tipo no soportado (${invalidFiles.map(f => f.type).join(', ')}).`);
        return;
      }
      
      setError(null);
      onFileSelect(fileArray);
    }
  }, [onFileSelect]);
  
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <h3 className="text-xl font-semibold text-white mb-4">Cargar Archivos</h3>
      <form id="form-file-upload" onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()} className="relative h-full">
        <input ref={inputRef} type="file" id="input-file-upload" accept=".csv,.txt,.pdf,.xlsx,.docx,.jpg,.jpeg,.png" multiple className="hidden" onChange={handleChange} disabled={disabled} />
        <label
          id="label-file-upload"
          htmlFor="input-file-upload"
          className={`h-64 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            dragActive ? 'border-brand-secondary bg-gray-700' : 'border-gray-600 hover:border-brand-secondary hover:bg-gray-700'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <div className="text-center">
            <UploadIcon className="w-10 h-10 mx-auto text-gray-400 mb-2"/>
            <p className="font-semibold">Arrastra y suelta tus archivos aquí</p>
            <p className="text-sm text-gray-400">(CSV, TXT, PDF, DOCX, XLSX, Imagen)</p>
            <p className="text-sm text-gray-400 mt-2">o</p>
            <button type="button" onClick={onButtonClick} disabled={disabled} className="mt-2 bg-brand-secondary text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
              Seleccionar Archivos
            </button>
          </div>
        </label>
        {dragActive && <div className="absolute w-full h-full top-0 left-0" onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}></div>}
      </form>
      {error && (
        <div className="mt-4 flex items-center p-3 bg-red-900/50 border border-red-500 text-red-300 rounded-lg">
          <WarningIcon className="w-5 h-5 mr-2"/>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
