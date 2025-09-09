'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSelector } from 'react-redux';
import axios from 'axios';

// Allowed statuses
const statuses = ['draft', 'paid', 'canceled'] as const;
type PaymentStatus = (typeof statuses)[number];

interface Sale {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface Center {
  _id: string;
  username?: string;
  email?: string;
}

interface Agent {
  _id: string;
  username?: string;
  email?: string;
}

interface CommissionSetting {
  _id: string;
  commissionPercentage: number;
  chargebackFee: number;
  clearingDays: number;
}

interface SalePayment {
  _id: string;
  saleId: Sale;
  saleAmount: number;
  status: PaymentStatus;
  createdAt: string;
  centerId: Center;
  agentId: Agent;
  commissionSettingId: CommissionSetting;
  commissionPercentage: number;
  commissionAmount: number;
  netPayable: number;
  payableOn: string;
}

interface FormData {
  saleId: string;
  status?: PaymentStatus;
}

export default function PaymentSalesPage() {
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [availableSales, setAvailableSales] = useState<Sale[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState<SalePayment | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Redux user
  const { id: userId, token, role } = useSelector((state: any) => state.user);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  // Fetch payments & sales
  useEffect(() => {
    if (!token) return;
    fetchPayments();
    fetchSales();
  }, [token, statusFilter, fromDate, toDate]);

  // re-calc available sales whenever sales/payments update
  useEffect(() => {
    const usedSaleIds = new Set(payments.map((p) => p.saleId._id));
    setAvailableSales(sales.filter((s) => !usedSaleIds.has(s._id)));
  }, [sales, payments]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sale-payments/all`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: statusFilter || undefined,
          from: fromDate || undefined,
          to: toDate || undefined,
        },
      });
      setPayments(res.data);
    } catch (err) {
      console.error('Error fetching payments', err);
    }
  };

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_BASE}/sales`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSales(res.data?.salesData || []);
    } catch (err) {
      console.error('Error fetching sales', err);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      if (editingPayment) {
        // super_admin / sub_admin can only update status
        if (role === 'super_admin' || role === 'sub_admin') {
          await axios.patch(
            `${API_BASE}/sale-payments/status`,
            { id: editingPayment._id, status: data.status },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } else {
        // creating → just send saleId, backend does calculation
        await axios.post(
          `${API_BASE}/sale-payments/request`,
          { saleId: data.saleId, agentId: userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await fetchPayments();
      setShowForm(false);
      setEditingPayment(null);
      reset();
    } catch (err) {
      console.error('Error saving payment', err);
    }
  };

  const handleEdit = (payment: SalePayment) => {
    setEditingPayment(payment);
    reset({
      saleId: payment.saleId._id,
      status: payment.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (paymentId: string) => {
    if (!paymentId) return;
    try {
      await axios.delete(`${API_BASE}/sale-payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchPayments();
    } catch (err) {
      console.error('Error deleting payment', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Sale Payments</h1>

      {/* Filters */}
      <div className="flex space-x-4 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s.toUpperCase()}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="border rounded px-3 py-2"
        />
        <button
          onClick={fetchPayments}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Apply Filters
        </button>
      </div>

      <button
        onClick={() => {
          reset();
          setEditingPayment(null);
          setShowForm(true);
        }}
        className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Create New Payment
      </button>

      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-3 py-2">Sale</th>
            <th className="border px-3 py-2">Center</th>
            <th className="border px-3 py-2">Agent</th>
            <th className="border px-3 py-2">Commission %</th>
            <th className="border px-3 py-2">Sale Amount</th>
            <th className="border px-3 py-2">Net Payable</th>
            <th className="border px-3 py-2">Status</th>
            <th className="border px-3 py-2">Created At</th>
            <th className="border px-3 py-2">Payable On</th>
                {role !== 'center_admin' &&
            <th className="border px-3 py-2">Actions</th>
                }
          </tr>
        </thead>
        <tbody>
          {payments.length > 0 ? (
            payments.map((p) => (
              <tr key={p._id}>
                <td className="border px-3 py-2">
                  {p.saleId?.amount} ({p.saleId?.status})
                </td>
                <td className="border px-3 py-2">
                  {p.centerId?.username || p.centerId?.email}
                </td>
                <td className="border px-3 py-2">
                  {p.agentId?.username || p.agentId?.email}
                </td>
                <td className="border px-3 py-2">{p.commissionPercentage}%</td>
                <td className="border px-3 py-2">
                  ${p.saleAmount.toFixed(2)}
                </td>
                <td className="border px-3 py-2">
                  ${p.netPayable.toFixed(2)}
                </td>
                <td className="border px-3 py-2">{p.status}</td>
                <td className="border px-3 py-2">
                  {new Date(p.createdAt).toLocaleString()}
                </td>
                
                <td className="border px-3 py-2">
                  {new Date(p.payableOn).toLocaleString()}
                </td>
                {role !== 'center_admin' &&
                <td className="border px-3 py-2 space-x-2">
                  {(role === 'super_admin' || role === 'sub_admin') && (
                    <button
                      onClick={() => handleEdit(p)}
                      className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                    >
                      Edit
                    </button>
                  )}
                </td>
}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} className="text-center py-4 text-gray-500">
                No payments found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold mb-6">
              {editingPayment ? 'Edit Payment' : 'Create Payment'}
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {!editingPayment ? (
                <>
                  {/* Sale Selection */}
                  <div>
                    <label className="block font-medium mb-1">Sale</label>
                    <select
                      className="w-full border rounded px-3 py-2"
                      {...register('saleId', { required: 'Sale is required' })}
                    >
                      <option value="">-- Select Sale --</option>
                      {availableSales.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.amount} ({s.status})
                        </option>
                      ))}
                    </select>
                    {errors.saleId && (
                      <p className="text-red-500 text-sm">
                        {errors.saleId.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {(role === 'super_admin' || role === 'sub_admin') && (
                    <div>
                      <label className="block font-medium mb-1">Status</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        {...register('status', { required: true })}
                        defaultValue={editingPayment.status}
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
              >
                {editingPayment ? 'Update Payment' : 'Create Payment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
