'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAppSelector } from '@/hooks/useTypedHooks';

type Account = {
  _id: string;
  username: string;
  email: string;
  role: string;
  status?: boolean;
  center?: string | null;
  createdAt?: string;
};

const API = process.env.NEXT_PUBLIC_API_URL;

export default function Page() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const currentUser = useAppSelector(state => state.user);

  const [formData, setFormData] = useState<{
  username: string;
  email: string;
  password?: string; // optional here
  role: string;
  status: boolean;
}>({
  username: '',
  email: '',
  password: undefined,  // or ''
  role: '',
  status: false,
});


  const role = currentUser?.role;
  const token = currentUser?.token;
  const center = currentUser?.id;

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await axios.get(`${API}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let filteredAccounts = res.data;

        if (role === 'center_admin') {
          filteredAccounts = res.data.filter(
            (acc: Account) => acc.role === 'agent' && acc.center === center
          );
        }

        else if (role === 'super_admin' ) {
          filteredAccounts = res.data.filter(
            (acc: Account) => acc.role === 'center_admin' || acc.role === 'sub_admin'
          );
        }

        else if (role === 'sub_admin' ) {
          filteredAccounts = res.data.filter(
            (acc: Account) => acc.role === 'center_admin'
          );
        }


        setAccounts(filteredAccounts);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      }
    };

    if (token && role) {
      fetchAccounts();
    }
  }, [token, role, center]);

  const openCreateModal = () => {
    setEditingAccount(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      role: '',
      status: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      username: account.username,
      email: account.email,
      password: '', // No password on edit
      role: account.role,
      status: account.status ?? false,
    });
    setIsModalOpen(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'status' ? value === 'true' : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingAccount) {
        // Remove password field if empty during update
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;

        await axios.put(`${API}/users/${editingAccount._id}`, updateData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const updated = await axios.get(`${API}/users`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        let filtered = updated.data;
         if (role === 'center_admin') {
          filtered = updated.data.filter(
            (acc: Account) => acc.role === 'agent' && acc.center === center
          );
        }

        else if (role === 'super_admin' ) {
          filtered = updated.data.filter(
            (acc: Account) => acc.role === 'center_admin' || acc.role === 'sub_admin'
          );
        }

        else if (role === 'sub_admin' ) {
          filtered = updated.data.filter(
            (acc: Account) => acc.role === 'center_admin'
          );
        }

        setAccounts(filtered);
      } else {
        let data;
        if(currentUser.role=="center_admin"){
          data={...formData,center: currentUser?.id}
        }
        else
        {
          data=formData;
        }
        const res = await axios.post(`${API}/users`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setAccounts(prev => [...prev, res.data]);
      }

      setIsModalOpen(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: '',
        status: false,
      });
      setEditingAccount(null);
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const handleDelete = async (_id: string) => {
    try {
      await axios.delete(`${API}/users/${_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAccounts(prev => prev.filter(acc => acc._id !== _id));
    } catch (error) {
      console.error('Failed to delete account:', error);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Create Account
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded-md">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-2 px-4 border">Username</th>
              <th className="py-2 px-4 border">Email</th>
              <th className="py-2 px-4 border">Role</th>
              <th className="py-2 px-4 border">Status</th>
              <th className="py-2 px-4 border">Created At</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(account => (
              <tr key={account._id}>
                <td className="py-2 px-4 border">{account.username}</td>
                <td className="py-2 px-4 border">{account.email}</td>
                <td className="py-2 px-4 border">{account.role}</td>
                <td className="py-2 px-4 border">
                  {account.status ? 'Active' : 'Inactive'}
                </td>
                <td className="py-2 px-4 border">
                  {account.createdAt
                    ? new Date(account.createdAt).toLocaleDateString()
                    : '—'}
                </td>
                <td className="py-2 px-4 border space-x-2">
                  <button
                    onClick={() => openEditModal(account)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(account._id)}
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {accounts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-4 text-gray-500">
                  No accounts found.
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
              {editingAccount ? 'Update Account' : 'Create Account'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select Role</option>
                  {currentUser?.role === 'super_admin' && (
                    <>
                      <option value="center_admin">Call center admin</option>
                      <option value="sub_admin">Sub admin</option>
                    </>
                  )}

                  {currentUser?.role === 'sub_admin' && (
                    <option value="center_admin">Call center admin</option>
                  )}

                  {currentUser?.role === 'center_admin' && (
                    <option value="agent">Agent</option>
                  )}
                </select>
              </div>

              {editingAccount && (
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={String(formData.status)}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="false">Inactive</option>
                    <option value="true">Active</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editingAccount ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
