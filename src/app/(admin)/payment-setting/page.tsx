'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import { useSelector } from 'react-redux';

interface CenterAdmin {
  _id: string;
  email: string;
  username: string;
  role: string;
  status: boolean;
}

interface Commission {
  _id: string;
  centerId: CenterAdmin;
  commissionPercentage: number;
  chargebackFee: number;
  clearingDays: number;
}

interface FormData {
  centerId: string;
  commissionPercentage: number;
  chargebackFee: number;
  clearingDays: number;
}

export default function CommissionPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [centers, setCenters] = useState<CenterAdmin[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCommission, setEditingCommission] = useState<Commission | null>(null);

  const { token } = useSelector((state: any) => state.user);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>();

  useEffect(() => {
    if (!token) return;
    fetchCommissions();
    fetchAvailableCenters();
  }, [token]);

  const fetchCommissions = async () => {
    try {
      const res = await axios.get(`${API_BASE}/commission-settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCommissions(res.data);
    } catch (err) {
      console.error('Error fetching commissions', err);
    }
  };

  const fetchAvailableCenters = async () => {
    try {
      const res = await axios.get(`${API_BASE}/commission-settings/available-centers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCenters(res.data);
    } catch (err) {
      console.error('Error fetching centers', err);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingCommission) {
        await axios.put(
          `${API_BASE}/commission-settings/${editingCommission._id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(`${API_BASE}/commission-settings`, data, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      await fetchCommissions();
      await fetchAvailableCenters();
      setShowForm(false);
      setEditingCommission(null);
      reset();
    } catch (err: any) {
      console.error('Error saving commission', err);
      if (err.response?.data?.message) alert(err.response.data.message);
    }
  };

  const handleEdit = (commission: Commission) => {
    setEditingCommission(commission);
    reset({
      centerId: commission.centerId._id,
      commissionPercentage: commission.commissionPercentage,
      chargebackFee: commission.chargebackFee,
      clearingDays: commission.clearingDays,
    });
    setShowForm(true);
  };

  const handleDelete = async (commission: Commission) => {
    try {
      await axios.delete(`${API_BASE}/commission-settings/${commission._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchCommissions();
      await fetchAvailableCenters();
    } catch (err) {
      console.error('Error deleting commission', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Commission Settings</h1>

      <button
        onClick={() => {
          reset();
          setEditingCommission(null);
          setShowForm(true);
        }}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {editingCommission ? 'Edit Commission' : 'Create New Commission'}
      </button>

      {/* Commission Table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Center</th>
            <th className="border px-3 py-2">Email</th>
            <th className="border px-3 py-2">Commission %</th>
            <th className="border px-3 py-2">Chargeback Fee</th>
            <th className="border px-3 py-2">Clearing Days</th>
            <th className="border px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {commissions.length > 0 ? (
            commissions.map((c) => (
              <tr key={c._id}>
                <td className="border px-3 py-2">{c.centerId?.username}</td>
                <td className="border px-3 py-2">{c.centerId?.email}</td>
                <td className="border px-3 py-2">{c.commissionPercentage}%</td>
                <td className="border px-3 py-2">${c.chargebackFee}</td>
                <td className="border px-3 py-2">{c.clearingDays} days</td>
                <td className="border px-3 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(c)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No commissions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative max-h-[80%] overflow-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-6">
              {editingCommission ? 'Edit Commission' : 'Create Commission'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Center Admin */}
              <div>
                <label className="block font-medium mb-1">Center Admin</label>
                {editingCommission ? (
                  <div className="p-2 border rounded bg-gray-100">
                    {editingCommission.centerId.username} ({editingCommission.centerId.email})
                    <input
                      type="hidden"
                      {...register('centerId')}
                      value={editingCommission.centerId._id}
                    />
                  </div>
                ) : (
                  <select
                    className="w-full border rounded px-3 py-2"
                    {...register('centerId', { required: 'Center is required' })}
                    defaultValue=""
                  >
                    <option value="">-- Select Center Admin --</option>
                    {centers.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.username} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
                {errors.centerId && (
                  <p className="text-red-500 text-sm">{errors.centerId.message}</p>
                )}
              </div>

              {/* Commission Percentage */}
              <div>
                <label className="block font-medium mb-1">Commission Percentage (%)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  {...register('commissionPercentage', { required: true, min: 0, max: 100 })}
                />
                {errors.commissionPercentage && (
                  <p className="text-red-500 text-sm">Invalid commission percentage</p>
                )}
              </div>

              {/* Chargeback Fee */}
              <div>
                <label className="block font-medium mb-1">Chargeback Fee (USD)</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  {...register('chargebackFee', { required: true, min: 0 })}
                />
                {errors.chargebackFee && (
                  <p className="text-red-500 text-sm">Invalid fee</p>
                )}
              </div>

              {/* Clearing Days */}
              <div>
                <label className="block font-medium mb-1">Clearing Days</label>
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2"
                  {...register('clearingDays', { required: true, min: 1 })}
                />
                {errors.clearingDays && (
                  <p className="text-red-500 text-sm">Invalid clearing days</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                {editingCommission ? 'Update Commission' : 'Create Commission'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
