import React, { useState, useEffect } from 'react';
import api from '../services/api';

const BASE_URL = 'https://collasphere.onrender.com';

function FilesTab({ projectId }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, [projectId]);

  const fetchFiles = async () => {
    try {
      const res = await api.get(`/files/project/${projectId}`);
      setFiles(res.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    setUploading(true);
    try {
      const res = await api.post(`/files/project/${projectId}`, formData);
      setFiles([res.data, ...files]);
      setSelectedFile(null);
      // Reset input naturally
      e.target.reset();
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleExplainCode = async (file) => {
    // In a real app, you would fetch the code content as text from the server.
    // Since we just uploaded it, we'll try to fetch it if it's text.
    setIsAnalyzing(true);
    setAiAnalysis('');
    
    try {
        // Fetch the file content
        const fileRes = await fetch(`${BASE_URL}/${file.path}`);
        let content;
        
        if (fileRes.status === 404) {
            console.log("File not on live server, trying local fallback...");
            try {
                const localRes = await fetch(`http://localhost:5000/${file.path}`);
                if (localRes.ok) {
                    content = await localRes.text();
                } else {
                    throw new Error("File not found on server (it may have been cleared during a restart). Try re-uploading!");
                }
            } catch (err) {
                throw new Error("File not found on server (it may have been cleared during a restart). Try re-uploading!");
            }
        } else if (!fileRes.ok) {
            throw new Error("Could not fetch file content");
        } else {
            content = await fileRes.text();
        }
        
        // Ensure it's not a huge binary file that's interpreted as text
        if (content.length > 50000) {
            setAiAnalysis("File is too large to analyze.");
            setIsAnalyzing(false);
            return;
        }

        const res = await api.post('/gemini/explain', { content, type: 'code' });
        setAiAnalysis(res.data.explanation);
    } catch (error) {
        console.error("AI Analysis error", error);
        setAiAnalysis("Failed to analyze this file. Is it a valid text/code file?");
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div>
      <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Upload File</h3>
        <form onSubmit={handleUpload} className="flex items-center space-x-4">
          <input
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-indigo-50 file:text-indigo-700
              hover:file:bg-indigo-100"
          />
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>
      </div>

      {isAnalyzing && (
        <div className="mb-6 animate-pulse p-4 bg-purple-50 rounded border border-purple-100">
            <h4 className="font-bold text-purple-800 mb-2">Analyzing Code with Gemini AI...</h4>
            <div className="space-y-2">
                <div className="h-4 bg-purple-200 rounded w-3/4"></div>
                <div className="h-4 bg-purple-200 rounded"></div>
            </div>
        </div>
      )}

      {aiAnalysis && !isAnalyzing && (
        <div className="mb-8 p-6 bg-white border-2 border-purple-300 shadow-sm rounded-lg">
            <h4 className="font-bold text-2xl text-purple-800 mb-4 flex items-center">
                <span className="mr-2">✨</span> Gemini Code Explanation
                <button onClick={() => setAiAnalysis('')} className="ml-auto text-gray-400 hover:text-gray-600 text-sm font-normal">Dismiss</button>
            </h4>
            <div className="ai-output">
                {aiAnalysis}
            </div>
        </div>
      )}

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Project Files</h3>
        {files.length === 0 ? (
          <p className="text-gray-500 text-sm">No files uploaded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-200 border rounded-md">
            {files.map((file) => (
              <li key={file._id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-2 rounded">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{file.originalname}</h4>
                    <p className="text-xs text-gray-500">
                      Uploaded by {file.uploader?.name || 'Unknown'} on {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <a
                    href={`${BASE_URL}/${file.path}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                  >
                    View / Download
                  </a>
                  
                  {/* Show AI button for potentially text-based files */}
                  {(file.originalname.match(/\.(js|jsx|ts|tsx|py|html|css|txt|json|md|java|cpp|c|go|rs)$/i)) && (
                    <button
                        onClick={() => handleExplainCode(file)}
                        className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1 rounded text-xs font-semibold"
                    >
                        Ask AI
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default FilesTab;
