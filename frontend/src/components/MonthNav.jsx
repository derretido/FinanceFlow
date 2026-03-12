import { ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export default function MonthNav({ year, month, onChange }) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12)
    else onChange(year, month - 1)
  }
  const next = () => {
    if (month === 12) onChange(year + 1, 1)
    else onChange(year, month + 1)
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border hover:bg-surface2 transition-colors">
        <ChevronLeft size={16} />
      </button>
      <span className="font-serif text-2xl text-accent min-w-48 text-center">
        {MONTHS[month - 1]} {year}
      </span>
      <button onClick={next}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-surface border border-border hover:bg-surface2 transition-colors">
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
