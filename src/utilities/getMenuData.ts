export type MenuItemType = 'link' | 'columnTitle' | 'featured' | 'cta'

export type MenuItemLink = {
  type?: 'reference' | 'custom' | null
  newTab?: boolean | null
  url?: string | null
  reference?: {
    relationTo?: string
    value?: unknown
  } | null
}

export type MenuItemMedia = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export type MenuItemRecord = {
  id: string | number
  label?: string | null
  type?: MenuItemType | null
  link?: MenuItemLink | null
  parent?: MenuItemRecord | string | number | null
  order?: number | null
  column?: number | null
  badge?: string | null
  description?: string | null
  image?: MenuItemMedia | string | number | null
}

export type MenuTreeNode = MenuItemRecord & { children: MenuTreeNode[] }

export type HeaderNavRow = {
  item?: MenuTreeNode | string | number | null
}

export type MenuHeaderData = {
  navItems?: HeaderNavRow[] | null
}

export const resolveTopLevel = (
  data: MenuHeaderData | null | undefined,
  menu: MenuTreeNode[],
): MenuTreeNode[] => {
  const rows = data?.navItems || []
  const topLevel: MenuTreeNode[] = []
  const seen = new Set<string | number>()

  for (const row of rows) {
    const raw = row?.item
    const id = raw && typeof raw === 'object' ? raw.id : raw

    if (id === undefined || id === null || seen.has(id)) continue

    const found = menu.find((n) => n.id === id)
    if (found) {
      seen.add(id)
      topLevel.push(found)
    }
  }

  return topLevel
}

export const buildMenuTree = (items: MenuItemRecord[]): MenuTreeNode[] => {
  const byId = new Map<string | number, MenuTreeNode>()

  for (const item of items) {
    if (!byId.has(item.id)) {
      byId.set(item.id, { ...item, children: [] })
    }
  }

  const roots: MenuTreeNode[] = []

  for (const node of byId.values()) {
    const rawParent = node.parent
    const parentId = rawParent && typeof rawParent === 'object' ? rawParent.id : rawParent

    if (parentId !== null && parentId !== undefined && byId.has(parentId)) {
      const parent = byId.get(parentId) as MenuTreeNode
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  const sortByOrder = (nodes: MenuTreeNode[]): MenuTreeNode[] =>
    nodes
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((node) => ({ ...node, children: sortByOrder(node.children) }))

  return sortByOrder(roots)
}
