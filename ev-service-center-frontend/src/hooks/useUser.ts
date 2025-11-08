/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { createUser, deleteUser, getUsers, updateUser } from '@/services/userService';
import { User } from '@/types/common';
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data.data))
      .finally(() => setLoading(false));
  }, []);

  return { users, loading };
}

export function useCreateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const create = async (data: any) => {
    setLoading(true)
    try {
      const res = await createUser(data)
      return res
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { create, loading, error }
}

export function useUpdateUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const update = async (id: string, data: any) => {
    setLoading(true)
    try {
      const res = await updateUser(id, data)
      return res
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { update, loading, error }
}

export function useDeleteUser() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const remove = async (id: string) => {
    setLoading(true)
    try {
      const res = await deleteUser(id)
      return res
    } catch (err: any) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { remove, loading, error }
}