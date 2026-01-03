/**
 * Registers common string formats for typebox schemas.
 *
 * This mirrors the default formats provided by `ajv-formats`
 * and is useful when using `TypeBoxValidatorCompiler`, since
 * TypeBox does not register string formats by default
 *
 * Formats registered:
 * - date
 * - date-time
 * - time
 * - email
 * - uuid
 * - url
 * - ipv4
 * - ipv6
 */

export async function registerTypeBoxFormats () {
  const { default: Format } = await import('typebox/format')

  // UUID
  const UUID = /^(?:urn:uuid:)?[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i

  // Date / Time
  const DATE_TIME_SEPARATOR = /t|\s/i
  const TIME = /^(\d\d):(\d\d):(\d\d(?:\.\d+)?)(z|([+-])(\d\d)(?::?(\d\d))?)?$/i
  const DATE = /^(\d\d\d\d)-(\d\d)-(\d\d)$/
  const DAYS = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

  // IP / URL / EMAIL
  const IPV4 = /^(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)$/
  const IPV6 =
    /^((([0-9a-f]{1,4}:){7}([0-9a-f]{1,4}|:))|(([0-9a-f]{1,4}:){6}(:[0-9a-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){5}(((:[0-9a-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9a-f]{1,4}:){4}(((:[0-9a-f]{1,4}){1,3})|((:[0-9a-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){3}(((:[0-9a-f]{1,4}){1,4})|((:[0-9a-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){2}(((:[0-9a-f]{1,4}){1,5})|((:[0-9a-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9a-f]{1,4}:){1}(((:[0-9a-f]{1,4}){1,6})|((:[0-9a-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9a-f]{1,4}){1,7})|((:[0-9a-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))$/i
  const URL =
    /^(?:https?|wss?|ftp):\/\/(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff]+-)*[a-z0-9\u00a1-\uffff]+)(?:\.(?:[a-z0-9\u00a1-\uffff]+-)*[a-z0-9\u00a1-\uffff]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/iu
  const EMAIL =
    /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i

  function isLeapYear (year: number) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  }

  function isDate (value: string) {
    const matches = DATE.exec(value)
    if (!matches) return false
    const year = +matches[1]
    const month = +matches[2]
    const day = +matches[3]
    return (
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= (month === 2 && isLeapYear(year) ? 29 : DAYS[month])
    )
  }

  function isTime (value: string) {
    return TIME.test(value)
  }

  function isDateTime (value: string) {
    const parts = value.split(DATE_TIME_SEPARATOR)
    return parts.length === 2 && isDate(parts[0]) && isTime(parts[1])
  }

  Format.Set('uuid', (value) => UUID.test(value))
  Format.Set('date', isDate)
  Format.Set('date-time', isDateTime)
  Format.Set('time', isTime)
  Format.Set('email', (value) => EMAIL.test(value))
  Format.Set('url', (value) => URL.test(value))
  Format.Set('ipv4', (value) => IPV4.test(value))
  Format.Set('ipv6', (value) => IPV6.test(value))
}
