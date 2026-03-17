import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BomNode, BomData } from '@/types/cad'

export const useBomStore = defineStore('bom', () => {
  const nodes = ref<BomNode[]>([])
  const selectedNodeId = ref<string | null>(null)
  const expandedNodeIds = ref<Set<string>>(new Set())
  const highlightedEntityIds = ref<string[]>([])

  const totalParts = computed(() => countNodes(nodes.value))
  const hasData = computed(() => nodes.value.length > 0)

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null
    return findNode(nodes.value, selectedNodeId.value)
  })

  function countNodes(list: BomNode[]): number {
    let count = 0
    for (const node of list) {
      count += node.quantity
      count += countNodes(node.children)
    }
    return count
  }

  function findNode(list: BomNode[], id: string): BomNode | null {
    for (const node of list) {
      if (node.id === id) return node
      const found = findNode(node.children, id)
      if (found) return found
    }
    return null
  }

  function setBomData(data: BomData) {
    nodes.value = data.nodes.map(cloneNode)
    selectedNodeId.value = null
    expandedNodeIds.value = new Set()
    highlightedEntityIds.value = []
  }

  function cloneNode(node: BomNode): BomNode {
    return {
      ...node,
      entityIds: [...node.entityIds],
      children: node.children.map(cloneNode),
    }
  }

  function selectNode(id: string | null) {
    selectedNodeId.value = id
    if (id) {
      const node = findNode(nodes.value, id)
      highlightedEntityIds.value = node?.entityIds ?? []
    } else {
      highlightedEntityIds.value = []
    }
  }

  function toggleExpand(id: string) {
    if (expandedNodeIds.value.has(id)) {
      expandedNodeIds.value.delete(id)
    } else {
      expandedNodeIds.value.add(id)
    }
    // Vue reactivity를 위한 새 Set 할당
    expandedNodeIds.value = new Set(expandedNodeIds.value)
  }

  function expandAll() {
    const ids = new Set<string>()
    function collect(list: BomNode[]) {
      for (const node of list) {
        if (node.children.length > 0) {
          ids.add(node.id)
          collect(node.children)
        }
      }
    }
    collect(nodes.value)
    expandedNodeIds.value = ids
  }

  function collapseAll() {
    expandedNodeIds.value = new Set()
  }

  function clear() {
    nodes.value = []
    selectedNodeId.value = null
    expandedNodeIds.value = new Set()
    highlightedEntityIds.value = []
  }

  return {
    nodes,
    selectedNodeId,
    expandedNodeIds,
    highlightedEntityIds,
    totalParts,
    hasData,
    selectedNode,
    setBomData,
    selectNode,
    toggleExpand,
    expandAll,
    collapseAll,
    clear,
  }
})
