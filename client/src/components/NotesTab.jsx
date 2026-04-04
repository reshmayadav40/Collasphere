import React, { useState, useEffect } from 'react';
import SimpleMDE from 'react-simplemde-editor';
import 'easymde/dist/easymde.min.css';
import api from '../services/api';

function NotesTab({ projectId }) {
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // AI States
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [projectId]);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes/project/${projectId}`);
      setNotes(res.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const handleCreateNew = () => {
    setSelectedNote(null);
    setTitle('');
    setContent('');
    setIsEditing(true);
    setAiAnalysis('');
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsEditing(false);
    setAiAnalysis('');
  };

  const handleSaveNote = async () => {
    try {
      if (selectedNote) {
        // Update existing note
        const res = await api.put(`/notes/${selectedNote._id}`, { title, content });
        setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
        setSelectedNote(res.data);
      } else {
        // Create new note
        const res = await api.post('/notes', { title, content, project: projectId });
        setNotes([res.data, ...notes]);
        setSelectedNote(res.data);
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    }
  };

  const handleAiAction = async (action) => {
    if (!content) return;
    setIsAnalyzing(true);
    setAiAnalysis('');
    
    try {
      const endpoint = action === 'explain' ? '/gemini/explain' : '/gemini/suggest';
      const payload = action === 'explain' ? { content, type: 'note' } : { content };
      
      const res = await api.post(endpoint, payload);
      setAiAnalysis(res.data.explanation || res.data.suggestions);
    } catch (error) {
      console.error(`Error with AI ${action}:`, error);
      setAiAnalysis('Failed to get AI response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6">
      {/* Sidebar for Notes List */}
      <div className="w-full md:w-1/3 border-r pr-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Notes</h3>
          <button
            onClick={handleCreateNew}
            className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            + New Note
          </button>
        </div>
        <div className="space-y-3 overflow-y-auto max-h-[500px]">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No notes yet.</p>
          ) : (
            notes.map(note => (
              <div
                key={note._id}
                onClick={() => handleSelectNote(note)}
                className={`p-3 rounded-md cursor-pointer transition-colors border ${
                  selectedNote?._id === note._id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <h4 className="font-medium text-gray-900 truncate">{note.title}</h4>
                <p className="text-xs text-gray-500 mt-1 truncate">{note.content.substring(0, 50)}...</p>
                <div className="text-xs text-gray-400 mt-2">
                    {new Date(note.updatedAt).toLocaleDateString()} by {note.author?.name || 'Unknown'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Editor/Viewer Area */}
      <div className="w-full md:w-2/3 flex flex-col">
        {isEditing || (!selectedNote && !isEditing && notes.length === 0) ? (
            <div className="flex flex-col h-full">
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-2xl font-bold mb-4 border-b pb-2 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex-grow flex-col">
                    <SimpleMDE 
                        value={content} 
                        onChange={setContent} 
                        options={{
                            autofocus: true,
                            spellChecker: false,
                        }}
                    />
                </div>
                <div className="mt-4 flex justify-end space-x-3">
                  {selectedNote && (
                      <button 
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                      >
                          Cancel
                      </button>
                  )}
                  <button 
                      onClick={handleSaveNote}
                      disabled={!title || !content}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                      Save Note
                  </button>
                </div>
            </div>
        ) : selectedNote ? (
            <div>
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedNote.title}</h2>
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Edit
                    </button>
                </div>
                
                {/* AI Actions */}
                <div className="mb-6 flex space-x-4 bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <div className="flex items-center mr-4">
                        <span className="text-2xl mr-2">✨</span>
                        <span className="font-semibold text-purple-900">Gemini AI</span>
                    </div>
                    <button 
                        onClick={() => handleAiAction('explain')}
                        disabled={isAnalyzing}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                    >
                        Explain Content
                    </button>
                    <button 
                        onClick={() => handleAiAction('suggest')}
                        disabled={isAnalyzing}
                        className="bg-white text-purple-700 border border-purple-300 hover:bg-purple-50 px-3 py-1.5 rounded text-sm transition-colors disabled:opacity-50"
                    >
                        Suggest Improvements
                    </button>
                </div>

                {isAnalyzing && (
                    <div className="mb-6 animate-pulse flex space-x-4 p-4 bg-gray-50 rounded border">
                        <div className="flex-1 space-y-4 py-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-300 rounded"></div>
                                <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                )}

                {aiAnalysis && !isAnalyzing && (
                    <div className="mb-6 p-4 bg-white border border-purple-200 shadow-sm rounded-lg">
                        <h4 className="font-bold text-purple-800 mb-2 flex items-center">
                            <span>AI Insight</span>
                            <button onClick={() => setAiAnalysis('')} className="ml-auto text-gray-400 hover:text-gray-600 text-sm">Dismiss</button>
                        </h4>
                        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                            {aiAnalysis}
                        </div>
                    </div>
                )}

                <div className="prose max-w-none">
                     {/* For a real app, use a proper markdown renderer here like react-markdown. For simplicity, we just use SimpleMDE in preview mode or simply render text. Since SimpleMDE handles its own preview, we'll just render it read-only or a simple text box if we don't install react-markdown. Let's install react-markdown to display it cleanly, wait, not in task list. We can just use standard pre-wrap or the SimpleMDE preview. */}
                     <div className="whitespace-pre-wrap font-serif text-gray-800">{selectedNote.content}</div>
                </div>
            </div>
        ) : (
            <div className="flex-grow flex items-center justify-center text-gray-500">
                Select a note to view or create a new one.
            </div>
        )}
      </div>
    </div>
  );
}

export default NotesTab;
