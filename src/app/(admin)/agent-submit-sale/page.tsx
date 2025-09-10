'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import axios from 'axios';

const statuses = ['pending', 'approved', 'declined', 'refunded'] as const;

interface Merchant {
  _id: string;
  name: string;
}

interface Sale {
  _id: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  amount: number;
  merchant: Merchant;
  status: string;
  submittedBy?: string;
}

interface FormData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  billingAddress: string;
  amount: number;
  merchant: string;
  status: string;
}

interface UserState {
  id: string;
  token: string;
  role: 'admin' | 'center_admin' | 'agent';
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [address, setAddress] = useState('');
  const addressInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ Strongly type Redux state
  const { id: userId, token, role } = useSelector(
    (state: { user: UserState }) => state.user
  );

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // Fetch sales & merchants
  useEffect(() => {
    if (!token) return;
    void fetchSales();
    void fetchMerchants();
  }, [token]);

  const fetchSales = async () => {
    try {
      const res = await axios.get<{ salesData: Sale[] }>(`${API_BASE}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data?.salesData || []);
    } catch (err) {
      console.error('Error fetching sales', err);
    }
  };

  const fetchMerchants = async () => {
    try {
      const res = await axios.get<Merchant[]>(`${API_BASE}/merchants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMerchants(res.data);
    } catch (err) {
      console.error('Error fetching merchants', err);
    }
  };

  // Google Places Autocomplete
  useEffect(() => {
    const g = (window as unknown as { google?: typeof google }).google;
    if (!g || !addressInputRef.current) return;

    const autocomplete = new g.maps.places.Autocomplete(addressInputRef.current, {
      types: ['address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (place.formatted_address) {
        setAddress(place.formatted_address);
        setValue('billingAddress', place.formatted_address, { shouldValidate: true });
      }
    });
  }, [setValue]);

  // Luhn algorithm
  const luhnCheck = (num: string) => {
    const arr = num
      .replace(/\D/g, '')
      .split('')
      .reverse()
      .map((x) => parseInt(x, 10));
    if (arr.length === 0) return false;
    const lastDigit = arr.shift()!;
    const sum = arr.reduce(
      (acc, val, i) => acc + (i % 2 === 0 ? ((val *= 2) > 9 ? val - 9 : val) : val),
      0
    );
    return (sum + lastDigit) % 10 === 0;
  };

  const onSubmit = async (data: FormData) => {
    try {
      // ✅ payload type
      const payload: Partial<FormData> & { submittedBy?: string } = {
        ...data,
        merchant: data.merchant,
      };

      if (editingSale) {
        delete payload.submittedBy;
        await axios.put(`${API_BASE}/sales/${editingSale._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        payload.submittedBy = userId;
        await axios.post(`${API_BASE}/sales`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      await fetchSales();
      setShowForm(false);
      setEditingSale(null);
      reset();
      setAddress('');
    } catch (err) {
      console.error('Error saving sale', err);
    }
  };

  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    reset({
      cardNumber: sale.cardNumber,
      expiryDate: sale.expiryDate,
      cvv: sale.cvv,
      billingAddress: sale.billingAddress,
      amount: sale.amount,
      merchant: sale.merchant._id,
      status: sale.status,
    });
    setAddress(sale.billingAddress || '');
    setShowForm(true);
  };

  const handleDelete = async (saleId: string) => {
    if (!saleId) return;
    try {
      await axios.delete(`${API_BASE}/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchSales();
    } catch (err) {
      console.error('Error deleting sale', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sales List</h1>

      {role === 'agent' && (
        <button
          onClick={() => {
            reset();
            setEditingSale(null);
            setAddress('');
            setShowForm(true);
          }}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Create New Sale
        </button>
      )}

      {/* table */}
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">ID</th>
            <th className="border px-3 py-2">Card</th>
            <th className="border px-3 py-2">Amount</th>
            <th className="border px-3 py-2">Merchant</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.length > 0 ? (
            sales.map((sale) => (
              <tr key={sale._id}>
                <td className="border px-3 py-2">{sale._id}</td>
                <td className="border px-3 py-2">{sale.cardNumber}</td>
                <td className="border px-3 py-2">${sale.amount.toFixed(2)}</td>
                <td className="border px-3 py-2">{sale.merchant?.name || 'Unknown'}</td>
                <td className="border px-3 py-2">{sale.status}</td>
                <td className="border px-3 py-2 space-x-2">
                  <button
                    onClick={() => handleEdit(sale)}
                    disabled={
                      (role === 'center_admin' || role === 'agent') &&
                      sale.status !== 'pending'
                    }
                    className={`bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 ${
                      (role === 'center_admin' || role === 'agent') &&
                      sale.status !== 'pending'
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(sale._id)}
                    disabled={
                      (role === 'center_admin' || role === 'agent') &&
                      sale.status !== 'pending'
                    }
                    className={`bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 ${
                      (role === 'center_admin' || role === 'agent') &&
                      sale.status !== 'pending'
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="text-center py-4 text-gray-500">
                No sales found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* modal */}
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
              {editingSale ? 'Edit Sale' : 'Create Sale'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block font-medium mb-1">Credit Card Number</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  {...register('cardNumber', {
                    required: 'Card number is required',
                    validate: (val) =>
                      luhnCheck(val.replace(/\s/g, '')) || 'Invalid card number',
                  })}
                  placeholder="4111 1111 1111 1111"
                  disabled={!!editingSale}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm">{errors.cardNumber.message}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block font-medium mb-1">Expiry Date (MM/YY)</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  {...register('expiryDate', {
                    required: 'Expiry date is required',
                    pattern: {
                      value: /^(0[1-9]|1[0-2])\/\d{2}$/,
                      message: 'Invalid expiry date format',
                    },
                  })}
                  placeholder="12/27"
                  disabled={!!editingSale}
                />
                {errors.expiryDate && (
                  <p className="text-red-500 text-sm">{errors.expiryDate.message}</p>
                )}
              </div>

              {/* CVV */}
              <div>
                <label className="block font-medium mb-1">CVV</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  {...register('cvv', {
                    required: 'CVV is required',
                    pattern: {
                      value: /^[0-9]{3,4}$/,
                      message: 'Invalid CVV',
                    },
                  })}
                  placeholder="123"
                  disabled={!!editingSale}
                />
                {errors.cvv && <p className="text-red-500 text-sm">{errors.cvv.message}</p>}
              </div>

              {/* Billing Address */}
              <div>
                <label className="block font-medium mb-1">Billing Address</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  placeholder="123 Main St, NY"
                  {...register('billingAddress', { required: 'Address is required' })}
                  onChange={(e) => {
                    setValue('billingAddress', e.target.value, { shouldValidate: true });
                    setAddress(e.target.value);
                  }}
                  value={address || ''}
                  ref={addressInputRef}
                />
                {errors.billingAddress && (
                  <p className="text-red-500 text-sm">{errors.billingAddress.message}</p>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block font-medium mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full border rounded px-3 py-2"
                  {...register('amount', {
                    required: 'Amount is required',
                    min: { value: 1, message: 'Amount must be at least 1' },
                    valueAsNumber: true,
                  })}
                  placeholder="250"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm">{errors.amount.message}</p>
                )}
              </div>

              {/* Merchant */}
              <div>
                <label className="block font-medium mb-1">Select Merchant</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  {...register('merchant', { required: 'Merchant selection is required' })}
                  defaultValue={editingSale ? editingSale.merchant._id : ''}
                >
                  <option value="">-- Select Merchant --</option>
                  {merchants.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                {errors.merchant && (
                  <p className="text-red-500 text-sm">{errors.merchant.message}</p>
                )}
              </div>

              {/* Status */}
              {role === 'center_admin' || role === 'agent' ? null : (
                <div>
                  <label className="block font-medium mb-1">Status</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    {...register('status', { required: 'Status is required' })}
                    defaultValue={editingSale ? editingSale.status : ''}
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {errors.status && (
                    <p className="text-red-500 text-sm">{errors.status.message}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                {editingSale ? 'Update Sale' : 'Create Sale'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
