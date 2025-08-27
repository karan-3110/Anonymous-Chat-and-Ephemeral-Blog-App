import React, { useState} from 'react';
const CommentBox = ({ onSubmit }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  };

  
  return (
    <div className="mt-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        className="p-2 border rounded w-full bg-white dark:bg-gray-700 text-black dark:text-white"
      />
      <button
        onClick={handleSubmit}
        className="mt-1 px-3 py-1 bg-indigo-500 text-white rounded"
      >
        Submit
      </button>
    </div>
  );
};

export default CommentBox;
