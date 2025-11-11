import React from 'react';
import { TREE_TYPES } from '../data/co2Increment';

export default function CalculatorForm({ inputs, onInputChange, onSubmit }) {
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : value;
    onInputChange(name, val);
  };

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: '100%', padding: '20px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        <div>
          <label>Порода дерева</label>
          <select name="treeType" value={inputs.treeType} onChange={handleChange}>
            {TREE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <Input name="areaHa" label="Площадь (га)" value={inputs.areaHa} onChange={handleChange} type="number" />
        <Input name="projectYears" label="Срок (лет)" value={inputs.projectYears} onChange={handleChange} min="1" max="80" type="number" />
        <Input name="discountRate" label="Ставка диск. (%)" value={inputs.discountRate * 100} onChange={(e) => handleChange({ target: { name: 'discountRate', value: parseFloat(e.target.value)/100 || 0, type: 'number' } })} type="number" step="0.1" />
        <Input name="inflation" label="Инфляция (%)" value={inputs.inflation * 100} onChange={(e) => handleChange({ target: { name: 'inflation', value: parseFloat(e.target.value)/100 || 0, type: 'number' } })} type="number" step="0.1" />

        <h3 style={{ gridColumn: '1 / -1' }}>Инвестиции</h3>
        {['landPrice', 'prepPerHa', 'seedlingsPerHa', 'seedlingCost', 'plantingCostPerHa', 'pestsInitialPerHa', 'equipmentPerHa', 'designVerification'].map(field => (
          <Input key={field} name={field} label={getLabel(field)} value={inputs[field]} onChange={handleChange} type="number" />
        ))}

        <h3 style={{ gridColumn: '1 / -1' }}>Операционные расходы и доходы</h3>
        {['weedingCostPerHa', 'weedingFreq', 'pruningCostPerHa', 'pruningFreq', 'thinningCostPerHa', 'carbonUnitPrice', 'timberPrice', 'timberVolumePerHa', 'timberHarvestCost', 'transportCostPerKm', 'transportDistance'].map(field => (
          <Input key={field} name={field} label={getLabel(field)} value={inputs[field]} onChange={handleChange} type="number" />
        ))}

        <h3 style={{ gridColumn: '1 / -1' }}>Налоги</h3>
        <Input name="profitTaxRate" label="Налог на прибыль (%)" value={inputs.profitTaxRate * 100} onChange={(e) => handleChange({ target: { name: 'profitTaxRate', value: parseFloat(e.target.value)/100 || 0, type: 'number' } })} type="number" step="0.1" />
      </div>

      <button type="submit" style={{ marginTop: '20px', padding: '12px 24px', fontSize: '16px', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
        Рассчитать
      </button>
    </form>
  );
}

function Input({ name, label, value, onChange, ...props }) {
  return (
    <div>
      <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>{label}</label>
      <input {...props} name={name} value={value} onChange={onChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
    </div>
  );
}

function getLabel(field) {
  const labels = {
    landPrice: 'Цена участка (₽)',
    prepPerHa: 'Подготовка 1 га (₽)',
    seedlingsPerHa: 'Саженцев на 1 га',
    seedlingCost: 'Стоимость саженца (₽)',
    plantingCostPerHa: 'Посадка на 1 га (₽)',
    pestsInitialPerHa: 'Борьба с вредителями (₽/га)',
    equipmentPerHa: 'Машины и оборудование (₽/га)',
    designVerification: 'Проектирование и верификация (₽)',
    weedingCostPerHa: 'Обработка от сорняков (₽/га)',
    weedingFreq: 'Кол-во обработок в год',
    pruningCostPerHa: 'Формирующая обрезка (₽/га)',
    pruningFreq: 'Кол-во обрезок в год',
    thinningCostPerHa: 'Прореживание (₽/га)',
    carbonUnitPrice: 'Цена УЕ (₽/т)',
    timberPrice: 'Цена древесины (₽/м³)',
    timberVolumePerHa: 'Объём древесины (м³/га)',
    timberHarvestCost: 'Сбор древесины (₽/м³)',
    transportCostPerKm: 'Транспорт (₽/м³/км)',
    transportDistance: 'Расстояние (км)'
  };
  return labels[field] || field;
}