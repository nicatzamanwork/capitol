import React, { createContext, useState, useContext } from "react";

const FinancialContext = createContext();

export function FinancialProvider({ children }) {
  // Qlobal maliyyə datası
  const [financialData, setFinancialData] = useState({
    monthlyIncome: 0,
    monthlyDebtPayments: 0,
    dtiRatio: 0, // (Debt / Income) * 100
    creditScore: 742, // Skrinşot 5-dəki standart dəyər
    totalAssets: 0,
    totalDebts: 0,
    isAnalyzed: false,
  });

  // Datanı yeniləyən və avtomatik DTI hesablayan funksiyalaşdırma
  const updateFinancials = (newData) => {
    setFinancialData((prev) => {
      const updated = { ...prev, ...newData };
      if (updated.monthlyIncome > 0) {
        updated.dtiRatio = Math.round(
          (updated.monthlyDebtPayments / updated.monthlyIncome) * 100
        );
      }
      updated.totalDebts = updated.monthlyDebtPayments * 12; // Sadələşdirilmiş illik borc proqnozu
      updated.totalAssets = updated.monthlyIncome * 3.5; // Şərti aktiv hesabı
      updated.isAnalyzed = true;
      return updated;
    });
  };

  return (
    <FinancialContext.Provider value={{ financialData, updateFinancials }}>
      {children}
    </FinancialContext.Provider>
  );
}

export const useFinancial = () => useContext(FinancialContext);
