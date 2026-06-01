import { listPendingApprovalPosts, updatePostStatus } from '../posts/post.service.js';
export async function listApprovals(workspaceId) {
    return listPendingApprovalPosts(workspaceId);
}
export async function approvePost(postId, workspaceId) {
    return updatePostStatus(postId, workspaceId, 'generated');
}
export async function rejectPost(postId, workspaceId) {
    return updatePostStatus(postId, workspaceId, 'failed');
}
