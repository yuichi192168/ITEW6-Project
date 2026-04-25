import { useState, useCallback, useEffect, useRef, useMemo } from 'react';

export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: () => Promise<void>;
  reset: () => void;
  setData: (data: T) => void;
}

/**
 * FIXED: Custom hook for managing async operations
 */
export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncReturn<T> => {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // Keep a ref to the function to avoid it being a dependency of useCallback
  const asyncFnRef = useRef(asyncFunction);
  useEffect(() => {
    asyncFnRef.current = asyncFunction;
  }, [asyncFunction]);

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await asyncFnRef.current();
      setState({ data: result, loading: false, error: null });
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message || 'An error occurred' });
    }
  }, []); // Stable identity

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  const setData = useCallback((data: T) => {
    setState({ data, loading: false, error: null });
  }, []);

  // Run only once on mount if immediate is true
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute, reset, setData };
};

/**
 * FORM HOOK
 */
export interface UseFormReturn<T> {
  formData: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => void;
  reset: () => void;
  setFormData: (data: T) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  isValid: boolean;
}

export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  validators?: Partial<Record<keyof T, (value: any) => string>>
): UseFormReturn<T> => {
  const [formData, setFormData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const validate = (field: keyof T, value: any) => {
    if (validators && validators[field]) {
      return validators[field]!(value);
    }
    return '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const field = id as keyof T;
    setFormData(prev => ({ ...prev, [field]: value }));

    if (touched[field]) {
      const error = validate(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    const field = id as keyof T;
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validate(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const reset = () => {
    setFormData(initialValues);
    setErrors({});
    setTouched({});
  };

  const setFieldValue = (field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValid = Object.values(errors).every(e => !e);

  return { formData, errors, touched, handleChange, handleBlur, reset, setFormData, setFieldValue, isValid };
};

/**
 * PAGINATION HOOK
 */
export const usePagination = <T,>(data: T[], defaultItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentData = data.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  }, [totalPages]);

  return { currentPage, totalPages, currentData, goToPage, itemsPerPage, setItemsPerPage };
};

/**
 * SEARCH HOOK
 */
export const useSearch = <T,>(data: T[], searchFields: (keyof T)[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const results = useMemo(() => {
    if (!searchQuery) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      searchFields.some(field => String(item[field]).toLowerCase().includes(query))
    );
  }, [data, searchQuery, searchFields]);

  return { searchQuery, results, setSearchQuery, reset: () => setSearchQuery('') };
};