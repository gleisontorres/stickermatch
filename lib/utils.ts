import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove zeros à esquerda do sufixo numérico do código (somente para exibição).
 * Ex.: MEX01 → MEX1, BRA02 → BRA2; MEX10 permanece MEX10.
 */
export function formatCodigo(codigo: string): string {
  return codigo.trim().replace(
    /([A-Z]+)0+(\d+)$/i,
    (_: string, prefix: string, num: string) =>
      `${prefix.toUpperCase()}${parseInt(num, 10)}`,
  )
}

/**
 * Converte entrada do usuário para o formato esperado pelo catálogo (ex.: MEX1 → MEX01).
 * Número com um dígito no fim ganha zero à esquerda; dois ou mais dígitos mantêm-se.
 */
export function normalizeCodigo(input: string): string {
  return input.toUpperCase().replace(/([A-Z]+)(\d+)$/, (_, prefix: string, num: string) => {
    return prefix + (num.length === 1 ? `0${num}` : num)
  })
}
