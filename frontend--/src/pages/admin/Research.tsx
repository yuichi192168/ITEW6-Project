import React, { useEffect, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { researchDB } from '../../lib/database';
import { EmptyState, FormInput } from '../../components/ui/shared';

interface ResearchItem {
  id: string;
  title: string;
  author: string;
  year: number;
  status: 'Published' | 'In Progress' | 'Draft' | string;
}

export const AdminResearch: React.FC = () => {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [form, setForm] = useState({ title: '', author: '', year: new Date().getFullYear(), status: 'In Progress' as ResearchItem['status'] });

  const { data: researchData, loading, error, execute: fetchResearch } = useAsync<ResearchItem[]>(() =>
    researchDB.getAllResearch().then((data: any) => data as ResearchItem[])
  );

  useEffect(() => {
    fetchResearch();
  }, [fetchResearch]);

  useEffect(() => {
    if (researchData?.length) {
      setResearch(researchData);
    }
  }, [researchData]);

  const handleChange = (field: string, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddResearch = async () => {
    if (!form.title || !form.author) {
      alert('Title and author are required');
      return;
    }

    try {
      const id = await researchDB.addResearch({
        title: form.title,
        author: form.author,
        year: form.year,
        status: form.status,
      });

      setResearch(prev => [...prev, { ...form, id }]);
      window.dispatchEvent(new Event('researchUpdated'));
      setForm({ title: '', author: '', year: new Date().getFullYear(), status: 'In Progress' });
      alert('Research entry added successfully');
    } catch (err) {
      console.error('add research error', err);
      alert('Failed to add research entry');
    }
  };

  const handleDeleteResearch = async (id: string) => {
    if (!confirm('Delete this research entry?')) return;

    try {
      await researchDB.deleteResearch(id);
      setResearch(prev => prev.filter(r => r.id !== id));
      window.dispatchEvent(new Event('researchUpdated'));
      alert('Research entry removed');
    } catch (err) {
      console.error('delete research error', err);
      alert('Failed to delete research entry');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">Research Management</h1>
      <p className="text-gray-600 mb-8">Manage research projects and publications</p>

      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Research</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Title"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            placeholder="Research title"
          />
          <FormInput
            label="Author"
            value={form.author}
            onChange={(e) => handleChange('author', e.target.value)}
            placeholder="Author name"
          />
          <FormInput
            label="Year"
            type="number"
            value={String(form.year)}
            onChange={(e) => handleChange('year', Number(e.target.value))}
            placeholder="Year"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2"
            >
              <option value="Published">Published</option>
              <option value="In Progress">In Progress</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
          <button onClick={handleAddResearch} className="bg-primary text-white py-2 px-4 rounded-lg mt-1 md:mt-0">
            Add Research
          </button>
        </div>
      </div>

      {loading && <p>Loading research entries...</p>}
      {error && <p className="text-red-600">Failed to load research entries from backend.</p>}

      {research.length === 0 ? (
        <EmptyState
          title="No research entries yet"
          description="Add research using the form above."
        />
      ) : (
        <div className="space-y-4">
          {research.map((item) => (
            <div key={item.id} className="card border flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{item.title}</h3>
                <p className="text-sm text-gray-600">By {item.author} | {item.year} | {item.status}</p>
              </div>
              <button onClick={() => handleDeleteResearch(item.id)} className="text-red-500 hover:text-red-700 text-sm">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
