import * as rawFormatsModule from 'ajv-formats/dist/formats.js'

const rawFormats = (rawFormatsModule as any).default ?? rawFormatsModule

type AjvFormat = {
  validate: (value: string) => boolean
}

export type FormatRegistry = {
  Set: (name: string, validate: (value: string) => boolean) => void
}

function isAjvFormat (value: unknown): value is AjvFormat {
  return typeof value === 'object' && value !== null && 'validate' in value
}

export function registerTypeBoxFormatsWith (Format: FormatRegistry) {
  const formats = rawFormats as Record<string, unknown>

  for (const [name, def] of Object.entries(formats)) {
    if (isAjvFormat(def)) {
      Format.Set(name, def.validate)
    }
  }
}
