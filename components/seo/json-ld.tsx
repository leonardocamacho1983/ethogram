export type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdNode
  | JsonLdValue[]

export type JsonLdNode = {
  [key: string]: JsonLdValue
}

function serializeJsonLd(data: JsonLdNode): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function JsonLd({ data, id }: { data: JsonLdNode; id: string }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      id={id}
      type="application/ld+json"
    />
  )
}
