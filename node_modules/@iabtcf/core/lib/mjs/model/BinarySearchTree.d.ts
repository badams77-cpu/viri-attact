import { Cloneable } from '../Cloneable.js';
interface TreeNode {
    value: number;
    right: TreeNode | null;
    left: TreeNode | null;
}
declare type TreeNodeMaybe = TreeNode | null;
export declare class BinarySearchTree extends Cloneable<BinarySearchTree> {
    private root;
    isEmpty(): boolean;
    add(value: number): void;
    /**
     * performs Morris in-order traversal
     * @return {number[]} sorted array
     */
    get(): number[];
    contains(value: number): boolean;
    min(current?: TreeNodeMaybe): number;
    max(current?: TreeNodeMaybe): number;
    remove(value: number, current?: TreeNodeMaybe): void;
}
export {};
