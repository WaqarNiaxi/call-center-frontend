'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppSelector } from '@/hooks/useTypedHooks';

type Merchant = {
  _id: string;
  name: string;
  createdAt?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function MerchantPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);

  const currentUser = useAppSelector(state => state.user);
  const token = currentUser?.token;

  const [formData, setFormData] = useState<{ name: string }>({
    name: '',
  });

  // Fetch merchants list
  useEffect(() => {
    const fetchMerchants = async () => {
      try {
        const res = await axios.get(`${API}/merchants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMerchants(res.data);
      } catch (err) {
        console.error('Failed to fetch merchants:', err);
      }
    };

    if (token) fetchMerchants();
  }, [token]);

  // Open create modal
  const openCreateModal = () => {
    setEditingMerchant(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (merchant: Merchant) => {
    setEditingMerchant(merchant);
    setFormData({ name: merchant.name });
    setIsModalOpen(true);
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ name: e.target.value });
  };

  // Submit create or update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMerchant) {
        // Update
        const updated = await axios.put(
          `${API}/merchants/${editingMerchant._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setMerchants((prev) =>
          prev.map((m) => (m._id === updated.data._id ? updated.data : m))
        );
      } else {
        // Create
        const created = await axios.post(`${API}/merchants`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMerchants((prev) => [...prev, created.data]);
      }

      setIsModalOpen(false);
      setFormData({ name: '' });
      setEditingMerchant(null);
    } catch (error) {
      console.error('Error submitting merchant:', error);
    }
  };

  // Delete merchant
  const handleDelete = async (_id: string) => {
    try {
      await axios.delete(`${API}/merchants/${_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerchants((prev) => prev.filter((m) => m._id !== _id));
    } catch (error) {
      console.error('Failed to delete merchant:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Merchants</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Merchant
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Name</th>
              <th className="py-2 px-4 border">Created At</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map((merchant) => (
              <tr key={merchant._id}>
                <td className="py-2 px-4 border">{merchant.name}</td>
                <td className="py-2 px-4 border">
                  {merchant.createdAt
                    ? new Date(merchant.createdAt).toLocaleDateString()
                    : '—'}
                </td>
                <td className="py-2 px-4 border space-x-2">
                  <button
                    onClick={() => openEditModal(merchant)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(merchant._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {merchants.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-4 text-gray-500">
                  No merchants found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[100000]">
          <div className="bg-white p-6 rounded-md w-full max-w-lg shadow-lg relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-2xl"
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">
              {editingMerchant ? 'Update Merchant' : 'Create Merchant'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingMerchant ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
