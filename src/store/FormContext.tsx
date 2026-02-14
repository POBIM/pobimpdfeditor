'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePdf } from '@/store/PdfContext';

export type FormFieldValue = string | boolean;

type PageFormValues = Map<string, FormFieldValue>;
type FormDataByPage = Map<number, PageFormValues>;

interface FormContextValue {
  setFieldValue: (pageNumber: number, fieldId: string, value: FormFieldValue) => void;
  getFieldValue: (pageNumber: number, fieldId: string) => FormFieldValue | undefined;
  getAllFormData: () => FormDataByPage;
  clearFormData: () => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ children }: { children: ReactNode }) {
  const { documentSession } = usePdf();
  const [formData, setFormData] = useState<FormDataByPage>(new Map());

  useEffect(() => {
    void documentSession;
    setFormData(new Map());
  }, [documentSession]);

  const setFieldValue = useCallback((pageNumber: number, fieldId: string, value: FormFieldValue) => {
    setFormData((prev) => {
      const next = new Map(prev);
      const pageValues = new Map(next.get(pageNumber) ?? new Map<string, FormFieldValue>());
      pageValues.set(fieldId, value);
      next.set(pageNumber, pageValues);
      return next;
    });
  }, []);

  const getFieldValue = useCallback(
    (pageNumber: number, fieldId: string) => {
      return formData.get(pageNumber)?.get(fieldId);
    },
    [formData]
  );

  const getAllFormData = useCallback(() => {
    return new Map(
      Array.from(formData.entries()).map(([pageNumber, values]) => [pageNumber, new Map(values)])
    );
  }, [formData]);

  const clearFormData = useCallback(() => {
    setFormData(new Map());
  }, []);

  const value = useMemo<FormContextValue>(
    () => ({
      setFieldValue,
      getFieldValue,
      getAllFormData,
      clearFormData,
    }),
    [setFieldValue, getFieldValue, getAllFormData, clearFormData]
  );

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm must be used within a FormProvider');
  }

  return context;
}
