// CalculatorForm.jsx
import React from 'react';
import { getSupportedTreeTypes } from '../data/co2Increment';

export default function CalculatorForm({ inputs, onInputChange, onSubmit }) {
  const treeTypes = getSupportedTreeTypes();

  const inputGroups = [
    {
      title: "Основные параметры проекта",
      inputs: [
        { name: "treeType", label: "Порода деревьев", type: "select", options: treeTypes },
        { name: "areaHa", label: "Площадь проекта (га)", type: "number", min: 1, max: 10000 },
        { name: "projectYears", label: "Срок проекта (лет)", type: "number", min: 1, max: 100 },
        { name: "discountRate", label: "Ставка дисконтирования (%)", type: "percent", step: 0.1, min: 0, max: 100 },
        { name: "inflation", label: "Уровень инфляции (%)", type: "percent", step: 0.1, min: 0, max: 50 }
      ]
    },
    {
      title: "Инвестиционные затраты",
      inputs: [
        { name: "landPrice", label: "Стоимость земли (руб)", type: "number" },
        { name: "prepPerHa", label: "Подготовка территории (руб/га)", type: "number" },
        { name: "seedlingsPerHa", label: "Саженцев на га (шт)", type: "number" },
        { name: "seedlingCost", label: "Цена саженца (руб)", type: "number" },
        { name: "plantingCostPerHa", label: "Посадка (руб/га)", type: "number" },
        { name: "pestsInitialPerHa", label: "Защита от вредителей (руб/га)", type: "number" },
        { name: "equipmentPerHa", label: "Оборудование (руб/га)", type: "number" },
        { name: "designVerification", label: "Проектирование и верификация (руб)", type: "number" }
      ]
    },
    {
      title: "Операционные расходы",
      inputs: [
        { name: "weedingCostPerHa", label: "Прополка (руб/га)", type: "number" },
        { name: "weedingFreq", label: "Частота прополки (раз/год)", type: "number", min: 0 },
        { name: "pruningCostPerHa", label: "Обрезка (руб/га)", type: "number" },
        { name: "pruningFreq", label: "Частота обрезки (раз/год)", type: "number", min: 0 },
        { name: "thinningCostPerHa", label: "Прореживание (руб/га)", type: "number" }
      ]
    },
    {
      title: "Доходы и цены",
      inputs: [
        { name: "carbonUnitPrice", label: "Цена углеродной единицы (руб/т)", type: "number" },
        { name: "timberPrice", label: "Цена древесины (руб/м³)", type: "number" },
        { name: "timberVolumePerHa", label: "Объем древесины (м³/га)", type: "number" },
        { name: "timberHarvestCost", label: "Стоимость заготовки (руб/м³)", type: "number" },
        { name: "transportCostPerKm", label: "Транспорт (руб/км/м³)", type: "number" },
        { name: "transportDistance", label: "Расстояние транспортировки (км)", type: "number" },
        { name: "profitTaxRate", label: "Налог на прибыль (%)", type: "percent", step: 0.1, min: 0, max: 100 }
      ]
    }
  ];

  const handleInputChange = (name, value) => {
    onInputChange(name, value);
  };

  const getInputValue = (input, value) => {
    if (input.type === 'percent') {
      return value !== undefined ? value : '';
    }
    return value !== undefined ? value : '';
  };

  return (
    <form onSubmit={onSubmit} style={{ marginBottom: '20px' }}>
      {inputGroups.map((group, groupIndex) => (
        <div key={groupIndex} style={{ 
          backgroundColor: 'white', 
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #e9ecef'
        }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>{group.title}</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '15px' 
          }}>
            {group.inputs.map((input, index) => (
              <div key={index}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                  {input.label}:
                </label>
                {input.type === 'select' ? (
                  <select
                    value={inputs[input.name] || ''}
                    onChange={(e) => handleInputChange(input.name, e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Выберите породу</option>
                    {input.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    value={getInputValue(input, inputs[input.name])}
                    onChange={(e) => {
                      const rawValue = parseFloat(e.target.value) || 0;
                      handleInputChange(input.name, rawValue);
                    }}
                    min={input.min}
                    max={input.max}
                    step={input.step}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '14px'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        style={{
          width: '100%',
          padding: '12px 24px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        🚀 Рассчитать проект
      </button>
    </form>
  );
}

