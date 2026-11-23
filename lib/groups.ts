import type { GroupKey } from './db';

export interface GroupDef {
  key: GroupKey;
  name: string;
  desc: string;
  icon: 'layers' | 'code' | 'palette';
  color: string;
}

/** 开发组定义：纯数据，不依赖 Node 模块，客户端组件也可安全引用 */
export const GROUPS: GroupDef[] = [
  {
    key: 'project',
    name: '项目组',
    desc: '组介绍文案待提供：这个组负责什么、有哪些项目。',
    icon: 'layers',
    color: '#7b5fe2',
  },
  {
    key: 'rd',
    name: '研发组',
    desc: '组介绍文案待提供：这个组负责什么、有哪些项目。',
    icon: 'code',
    color: '#4ba458',
  },
  {
    key: 'design',
    name: '设计组',
    desc: '组介绍文案待提供：这个组负责什么、有哪些项目。',
    icon: 'palette',
    color: '#28abe2',
  },
];

export function getGroup(key: string): GroupDef | undefined {
  return GROUPS.find((g) => g.key === key);
}

export function isGroupKey(key: string): key is GroupKey {
  return GROUPS.some((g) => g.key === key);
}
