import { listPendingApprovalPosts, updatePostStatus } from '../posts/post.service.js';

export async function listApprovals(workspaceId: string) {
  return listPendingApprovalPosts(workspaceId);
}

export async function approvePost(postId: string, workspaceId: string) {
  return updatePostStatus(postId, workspaceId, 'generated');
}

export async function rejectPost(postId: string, workspaceId: string) {
  return updatePostStatus(postId, workspaceId, 'failed');
}
