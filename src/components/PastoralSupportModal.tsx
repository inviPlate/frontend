import { useState, useEffect } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Progress } from 'flowbite-react';
import useAxios from '../context/useAxios';
import { API_PATHS } from '../utils/apiPath';
import { PASTORAL_HEAD_IDS } from '../constants/pastoralHeadIds';

interface PastoralSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  yearId: number;
}

type ModeOfPayment = 'cash' | 'cheque' | 'upi';

export function PastoralSupportModal({ isOpen, onClose, onSubmitted, yearId }: PastoralSupportModalProps) {
  const axiosInstance = useAxios();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [modeOfPayment, setModeOfPayment] = useState<ModeOfPayment>('cash');
  const [isSaving, setIsSaving] = useState(false);
  const [totalRequests, setTotalRequests] = useState(0);
  const [completedRequests, setCompletedRequests] = useState(0);

  const [values, setValues] = useState<Record<string, string | number>>({
    basicDA: '',
    bookAllowance: '',
    conveyancePetrol: '',
    childAllowance: '',
    hospitalityAllowance: '',
    specialAllowance: '',
    pf: '',
    rent: '',
    telephoneInternet: '',
    medicalAllowance: '',
  });

  const resetForm = () => {
    setDate(new Date().toISOString().split('T')[0]);
    setModeOfPayment('cash');
    setValues({
      basicDA: '',
      bookAllowance: '',
      conveyancePetrol: '',
      childAllowance: '',
      hospitalityAllowance: '',
      specialAllowance: '',
      pf: '',
      rent: '',
      telephoneInternet: '',
      medicalAllowance: '',
    });
  };

  const handleChange = (key: keyof typeof values, v: string) => {
    setValues(prev => ({ ...prev, [key]: v }));
  };

  const entriesConfig: Array<{ key: keyof typeof values; label: string; headId: number; desc: string }> = [
    { key: 'basicDA', label: 'Basic + DA', headId: PASTORAL_HEAD_IDS.BASIC_DA, desc: 'Basic + DA' },
    { key: 'bookAllowance', label: 'Book Allowance', headId: PASTORAL_HEAD_IDS.BOOK_ALLOWANCE, desc: 'Book Allowance' },
    { key: 'conveyancePetrol', label: 'Conv./Petrol Allowance', headId: PASTORAL_HEAD_IDS.CONVEYANCE_PETROL_ALLOWANCE, desc: 'Conveyance/Petrol Allowance' },
    { key: 'childAllowance', label: 'Child Allowance', headId: PASTORAL_HEAD_IDS.CHILD_ALLOWANCE, desc: 'Child Allowance' },
    { key: 'hospitalityAllowance', label: 'Hospitality Allowance', headId: PASTORAL_HEAD_IDS.HOSPITALITY_ALLOWANCE, desc: 'Hospitality Allowance' },
    { key: 'specialAllowance', label: 'Special Allowance', headId: PASTORAL_HEAD_IDS.SPECIAL_ALLOWANCE, desc: 'Special Allowance' },
    { key: 'pf', label: 'PF', headId: PASTORAL_HEAD_IDS.PF, desc: 'PF' },
    { key: 'rent', label: 'Rent', headId: PASTORAL_HEAD_IDS.RENT, desc: 'Rent' },
    { key: 'telephoneInternet', label: 'Telephone / internet', headId: PASTORAL_HEAD_IDS.TELEPHONE_INTERNET, desc: 'Telephone / Internet' },
    { key: 'medicalAllowance', label: 'Medical Allowance', headId: PASTORAL_HEAD_IDS.MEDICAL_ALLOWANCE, desc: 'Medical Allowance' },
  ].sort((a, b) => a.key.localeCompare(b.key));

  const toNumber = (v: string | number) => {
    const n = typeof v === 'number' ? v : Number(v);
    return isNaN(n) ? 0 : n;
  };

  const pastoralSupportTotal = entriesConfig.reduce((sum, cfg) => sum + toNumber(values[cfg.key]), 0);

  // Prefill monthly values from budget (annual/12) for the effective year
  useEffect(() => {
    const fetchBudget = async () => {
      if (!isOpen || !yearId) return;
      try {
        const url = `${API_PATHS.GET_BUDGET('expense', 1, 1000)}&year_id=${yearId}`;
        const res = await axiosInstance.get(url);
        const data = res.data?.data || [];

        const headIdToMonthly: Record<number, number> = {};
        for (const item of data) {
          const headId = item?.head_id ?? item?.year_head?.head_id ?? item?.head?.id ?? null;
          const annual = item?.budgeted ?? item?.amount ?? item?.budget ?? item?.annual ?? 0;
          if (headId && typeof annual === 'number' && annual > 0) {
            headIdToMonthly[Number(headId)] = Number((annual / 12));
          }
        }

        const nextValues = { ...values } as Record<string, string | number>;
        entriesConfig.forEach(cfg => {
          const monthly = headIdToMonthly[cfg.headId];
          if (monthly !== undefined) {
            nextValues[cfg.key] = Number(monthly.toFixed(2));
          }
        });
        setValues(nextValues);
      } catch (e) {
        // ignore prefill errors
        console.error('Failed to prefill from budget', e);
      }
    };
    fetchBudget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, yearId]);

  const handleSubmit = async () => {
    const year_id = yearId;
    if (!year_id) {
      alert('Year is not selected.');
      return;
    }

    const payloads = entriesConfig
      .map(cfg => {
        const raw = values[cfg.key];
        const amountNum = Number(raw);
        if (!raw || isNaN(amountNum) || amountNum <= 0 || cfg.headId <= 0) return null;
        return {
          head_id: cfg.headId,
          description: cfg.desc,
          amount: amountNum,
          date,
          type: 'expense' as const,
          year_id,
          mode_of_payment: modeOfPayment,
        };
      })
      .filter(Boolean) as Array<{ head_id: number; description: string; amount: number; date: string; type: 'expense'; year_id: number; mode_of_payment: ModeOfPayment }>;

    if (payloads.length === 0) {
      alert('Please enter at least one positive amount and ensure head IDs are configured.');
      return;
    }

    setIsSaving(true);
    setCompletedRequests(0);
    setTotalRequests(payloads.length);
    try {
      for (const p of payloads) {
        try {
          await axiosInstance.post(API_PATHS.ADD_TRANSACTIONS, p);
        } catch (e) {
          // collect errors but continue
          console.error('Pastoral item failed', p, e);
        } finally {
          setCompletedRequests(prev => prev + 1);
        }
      }
      resetForm();
      onClose();
      onSubmitted();
    } catch (e) {
      console.error('Error saving pastoral support transactions', e);
      alert('Failed to save one or more transactions.');
    } finally {
      setIsSaving(false);
      setTotalRequests(0);
      setCompletedRequests(0);
    }
  };

  return (
    <Modal show={isOpen} onClose={onClose} size="lg" className="bg-gray-50">
      <ModalHeader className="bg-white border-b border-gray-200 text-gray-800">
        <div className="text-lg font-semibold text-gray-900">Add Pastoral Support</div>
      </ModalHeader>
      <ModalBody className="bg-white">
        <div className="space-y-5">
          {isSaving && totalRequests > 0 && (
            <div className="space-y-2">
              <div className="text-sm text-gray-700">Submitting {completedRequests}/{totalRequests}</div>
              <Progress progress={Math.min(100, Math.round((completedRequests / totalRequests) * 100))} color="blue" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-black">Date</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block mb-2 text-sm font-medium text-black">Mode of Payment</label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mode_of_payment"
                    value="cash"
                    checked={modeOfPayment === 'cash'}
                    onChange={e => setModeOfPayment(e.target.value as ModeOfPayment)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  Cash
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mode_of_payment"
                    value="cheque"
                    checked={modeOfPayment === 'cheque'}
                    onChange={e => setModeOfPayment(e.target.value as ModeOfPayment)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  Cheque
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="mode_of_payment"
                    value="upi"
                    checked={modeOfPayment === 'upi'}
                    onChange={e => setModeOfPayment(e.target.value as ModeOfPayment)}
                    className="mr-2 text-blue-600 focus:ring-blue-500"
                  />
                  UPI
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-black">Pastoral Support</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-200 text-gray-900 rounded-lg">
                {pastoralSupportTotal.toFixed(2)}
              </div>
            </div>
            {entriesConfig.map(item => (
              <div key={item.key}>
                <label className="block mb-2 text-sm font-medium text-black">{item.label}</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={values[item.key] as string | number}
                  onChange={e => handleChange(item.key, e.target.value)}
                  className="w-full px-3 py-2 bg-blue-50 border border-blue-200 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="bg-gray-50 border-t border-gray-200">
        <Button onClick={onClose} color="gray" className="bg-gray-500 hover:bg-gray-600 text-white">Cancel</Button>
        <Button onClick={handleSubmit} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white">
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </ModalFooter>
    </Modal>
  );
}


