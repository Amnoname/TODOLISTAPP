import { useState } from 'react';
import { useStore } from '../store';

export default function CategoryForm({ onClose }) {
  const [name, setName] = useState('');

  const createCategory = useStore((state) => state.createCategory);
  const loading = useStore((state) => state.loading);
  const error = useStore((state) => state.error);
  const successMessage = useStore((state) => state.successMessage);
  const clearMessages = useStore((state) => state.clearMessages);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await createCategory({ name });

    if (success) {
      setName('');
      setTimeout(() => clearMessages(), 2000);
      onClose();
    }
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <h2>Create New Category</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Category Name *</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="btn-group">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Category'}
          </button>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
