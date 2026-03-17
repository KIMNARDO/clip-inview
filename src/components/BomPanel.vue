<script setup lang="ts">
import { useBomStore } from '@/stores/bom'
import type { BomNode } from '@/types/cad'
import {
  ChevronRightIcon,
  ChevronDownIcon,
  BoxIcon,
  ChevronsUpDownIcon,
  ChevronsDownUpIcon,
} from 'lucide-vue-next'

const bomStore = useBomStore()

const emit = defineEmits<{
  highlightEntities: [entityIds: string[]]
  clearHighlight: []
}>()

function handleSelect(node: BomNode) {
  if (bomStore.selectedNodeId === node.id) {
    bomStore.selectNode(null)
    emit('clearHighlight')
  } else {
    bomStore.selectNode(node.id)
    emit('highlightEntities', node.entityIds)
  }
}
</script>

<template>
  <aside class="bom-panel-root">
    <div class="bom-panel-header">
      <span class="bom-panel-title">BOM Tree</span>
      <span class="bom-panel-count">{{ bomStore.totalParts }} parts</span>
    </div>

    <div class="bom-panel-actions">
      <button class="bom-action-button" title="모두 펼치기" @click="bomStore.expandAll()">
        <ChevronsUpDownIcon :size="12" :stroke-width="1.5" />
        <span>Expand</span>
      </button>
      <button class="bom-action-button" title="모두 접기" @click="bomStore.collapseAll()">
        <ChevronsDownUpIcon :size="12" :stroke-width="1.5" />
        <span>Collapse</span>
      </button>
    </div>

    <div v-if="!bomStore.hasData" class="bom-panel-empty">
      <p>파일을 열면 BOM 정보가 표시됩니다</p>
    </div>

    <div v-else class="bom-tree">
      <BomTreeNode
        v-for="node in bomStore.nodes"
        :key="node.id"
        :node="node"
        :depth="0"
        @select="handleSelect"
      />
    </div>
  </aside>
</template>

<script lang="ts">
import { defineComponent, h } from 'vue'

/** 재귀 트리 노드 컴포넌트 */
const BomTreeNode = defineComponent({
  name: 'BomTreeNode',
  props: {
    node: { type: Object as () => BomNode, required: true },
    depth: { type: Number, required: true },
  },
  emits: ['select'],
  setup(props, { emit }) {
    const bomStore = useBomStore()

    return () => {
      const node = props.node
      const hasChildren = node.children.length > 0
      const isExpanded = bomStore.expandedNodeIds.has(node.id)
      const isSelected = bomStore.selectedNodeId === node.id

      const children: ReturnType<typeof h>[] = []

      // 현재 노드 버튼
      children.push(
        h(
          'button',
          {
            class: [
              'bom-tree-item',
              { 'bom-tree-item--selected': isSelected },
            ],
            style: { paddingLeft: `${8 + props.depth * 16}px` },
            onClick: () => emit('select', node),
          },
          [
            // expand/collapse 토글
            hasChildren
              ? h(
                  'span',
                  {
                    class: 'bom-tree-toggle',
                    onClick: (e: Event) => {
                      e.stopPropagation()
                      bomStore.toggleExpand(node.id)
                    },
                  },
                  [
                    h(isExpanded ? ChevronDownIcon : ChevronRightIcon, {
                      size: 12,
                      'stroke-width': 1.5,
                    }),
                  ],
                )
              : h('span', { class: 'bom-tree-toggle-spacer' }),
            // 아이콘
            h(BoxIcon, {
              size: 14,
              'stroke-width': 1.5,
              class: 'bom-tree-icon',
            }),
            // 부품 이름
            h('span', { class: 'bom-tree-name' }, node.name),
            // 수량
            h('span', { class: 'bom-tree-qty' }, `×${node.quantity}`),
          ],
        ),
      )

      // 자식 노드 (재귀)
      if (hasChildren && isExpanded) {
        for (const child of node.children) {
          children.push(
            h(BomTreeNode, {
              key: child.id,
              node: child,
              depth: props.depth + 1,
              onSelect: (n: BomNode) => emit('select', n),
            }),
          )
        }
      }

      return h('div', { class: 'bom-tree-node' }, children)
    }
  },
})

export default {}
</script>

<style scoped>
.bom-panel-root {
  width: var(--cad-properties-width);
  display: flex;
  flex-direction: column;
  background: var(--cad-bg-panel);
  border-left: 1px solid var(--cad-border-default);
  user-select: none;
  overflow: hidden;
}

.bom-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--cad-space-2) var(--cad-space-3);
  border-bottom: 1px solid var(--cad-border-default);
}

.bom-panel-title {
  font-size: var(--cad-text-sm);
  font-weight: var(--cad-font-semibold);
  color: var(--cad-text-primary);
}

.bom-panel-count {
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  font-family: var(--cad-font-mono);
}

.bom-panel-actions {
  display: flex;
  gap: var(--cad-space-1);
  padding: var(--cad-space-1) var(--cad-space-2);
  border-bottom: 1px solid var(--cad-border-default);
}

.bom-action-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 2px var(--cad-space-2);
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-secondary);
  background: transparent;
  border: 1px solid var(--cad-border-default);
  border-radius: var(--cad-radius-sm);
  cursor: pointer;
  transition: all var(--cad-transition-fast);
}

.bom-action-button:hover {
  background: var(--cad-hover-bg);
  color: var(--cad-text-primary);
}

.bom-panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--cad-space-4);
}

.bom-panel-empty p {
  font-size: var(--cad-text-xs);
  color: var(--cad-text-muted);
  text-align: center;
}

.bom-tree {
  flex: 1;
  overflow-y: auto;
  padding: var(--cad-space-1) 0;
}

:deep(.bom-tree-item) {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 3px 8px;
  font-size: var(--cad-text-sm);
  color: var(--cad-text-primary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background var(--cad-transition-fast);
  text-align: left;
}

:deep(.bom-tree-item:hover) {
  background: var(--cad-hover-bg);
}

:deep(.bom-tree-item--selected) {
  background: var(--cad-accent-active-bg);
}

:deep(.bom-tree-toggle) {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--cad-text-muted);
  flex-shrink: 0;
  cursor: pointer;
  border-radius: var(--cad-radius-sm);
}

:deep(.bom-tree-toggle:hover) {
  color: var(--cad-text-primary);
  background: var(--cad-hover-bg-strong);
}

:deep(.bom-tree-toggle-spacer) {
  width: 16px;
  flex-shrink: 0;
}

:deep(.bom-tree-icon) {
  color: var(--cad-text-muted);
  flex-shrink: 0;
}

:deep(.bom-tree-name) {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.bom-tree-qty) {
  font-size: var(--cad-text-2xs);
  color: var(--cad-text-muted);
  font-family: var(--cad-font-mono);
  flex-shrink: 0;
}
</style>
