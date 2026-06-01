import { useEffect, useState } from 'react';
import { BrandProfile, Platform, PostType, PostDraft } from '@social-ai/shared';

interface PlatformAccountSummary {
  id: string;
  platform: Platform;
  accountLabel: string;
  accessToken?: string;
  createdAt?: string;
}

interface PublishAttempt {
  id: string;
  postId: string;
  platform: Platform;
  status: 'success' | 'failed';
  requestPayload?: unknown;
  responsePayload?: unknown;
  errorMessage?: string | null;
  createdAt?: string;
}
import { api } from '../lib/api';
import { SectionCard } from '../components/SectionCard';

const platformOptions: Platform[] = ['meta_instagram', 'meta_facebook', 'linkedin', 'x', 'tiktok', 'youtube'];
const postTypeOptions: PostType[] = ['sales', 'casual', 'educational', 'storytelling', 'comparison', 'case_study', 'testimonial', 'offer'];

export function App() {
  const [posts, setPosts] = useState<PostDraft[]>([]);
  const [approvals, setApprovals] = useState<PostDraft[]>([]);
  const [accounts, setAccounts] = useState<PlatformAccountSummary[]>([]);
  const [attempts, setAttempts] = useState<Record<string, PublishAttempt[]>>({});
  const [createdBrandId, setCreatedBrandId] = useState('');
  const [message, setMessage] = useState('');
  const [brandForm, setBrandForm] = useState({
    workspaceId: 'demo-workspace',
    name: '',
    businessSummary: '',
    audience: '',
    tone: 'clear, modern, persuasive',
    goalsCsv: 'awareness, engagement, leads',
    bannedPhrasesCsv: '',
    requiredMentionsCsv: ''
  });
  const [scheduleForm, setScheduleForm] = useState({
    workspaceId: 'demo-workspace',
    brandId: '',
    timezone: 'UTC',
    daysOfWeekCsv: '1,3,5',
    localTime: '10:00',
    postTypes: ['sales'] as PostType[],
    platforms: ['meta_instagram'] as Platform[],
    requireApproval: true
  });
  const [form, setForm] = useState({
    workspaceId: 'demo-workspace',
    brandId: '',
    prompt: '',
    postType: 'sales' as PostType,
    platforms: ['meta_instagram'] as Platform[],
    withImage: true,
    requireApproval: true,
    scheduledFor: ''
  });
  const [platformForm, setPlatformForm] = useState({
    workspaceId: 'demo-workspace',
    platform: 'meta_instagram' as Platform,
    accountLabel: '',
    accessToken: '',
    refreshToken: '',
    metaJson: '{}'
  });

  async function loadDashboard() {
    const [postData, approvalData, accountData] = await Promise.all([
      api.get<PostDraft[]>('/v1/posts'),
      api.get<PostDraft[]>('/v1/approvals'),
      api.get<PlatformAccountSummary[]>('/v1/platforms/accounts?workspaceId=demo-workspace')
    ]);
    setPosts(postData);
    setApprovals(approvalData);
    setAccounts(accountData);
  }

  async function loadAttempts(postId: string) {
    try {
      const data = await api.get<PublishAttempt[]>(`/v1/publish/${postId}/attempts`);
      setAttempts((current) => ({ ...current, [postId]: data }));
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleBrandCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      const brand = await api.post<BrandProfile>('/v1/brands', {
        workspaceId: brandForm.workspaceId,
        name: brandForm.name,
        businessSummary: brandForm.businessSummary,
        audience: brandForm.audience,
        tone: brandForm.tone,
        goals: splitCsv(brandForm.goalsCsv),
        bannedPhrases: splitCsv(brandForm.bannedPhrasesCsv),
        requiredMentions: splitCsv(brandForm.requiredMentionsCsv)
      });
      setCreatedBrandId(brand.id);
      setForm((current) => ({ ...current, brandId: brand.id }));
      setScheduleForm((current) => ({ ...current, brandId: brand.id }));
      setMessage(`Brand created: ${brand.id}`);
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleScheduleCreate(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post('/v1/schedules', {
        workspaceId: scheduleForm.workspaceId,
        brandId: scheduleForm.brandId,
        enabled: true,
        timezone: scheduleForm.timezone,
        daysOfWeek: splitCsv(scheduleForm.daysOfWeekCsv).map(Number),
        localTime: scheduleForm.localTime,
        postTypes: scheduleForm.postTypes,
        platforms: scheduleForm.platforms,
        requireApproval: scheduleForm.requireApproval
      });
      setMessage('Schedule created');
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post('/v1/posts/generate', { ...form, scheduledFor: form.scheduledFor || undefined });
      setForm((current) => ({ ...current, prompt: '' }));
      setMessage('Post generated');
      await loadDashboard();
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function handleAccountSave(event: React.FormEvent) {
    event.preventDefault();
    try {
      await api.post('/v1/platforms/accounts', {
        workspaceId: platformForm.workspaceId,
        platform: platformForm.platform,
        accountLabel: platformForm.accountLabel,
        accessToken: platformForm.accessToken,
        refreshToken: platformForm.refreshToken || undefined,
        meta: parseMetaJson(platformForm.metaJson)
      });
      setPlatformForm((current) => ({ ...current, accountLabel: '', accessToken: '', refreshToken: '', metaJson: '{}' }));
      setMessage('Platform account saved');
      await loadDashboard();
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function approve(postId: string) {
    try {
      await api.post(`/v1/posts/${postId}/approve`, {});
      setMessage('Post approved');
      await loadDashboard();
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function publish(postId: string) {
    try {
      await api.post(`/v1/publish/${postId}/now`, {});
      setMessage('Publish attempted');
      await loadDashboard();
      await loadAttempts(postId);
    } catch (error) {
      setMessage(readError(error));
    }
  }

  async function runSchedules() {
    try {
      await api.post('/v1/schedules/run', {});
      setMessage('Scheduler tick executed');
      await loadDashboard();
    } catch (error) {
      setMessage(readError(error));
    }
  }

  useEffect(() => {
    loadDashboard().catch((error) => setMessage(readError(error)));
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1>Social AI</h1>
        <p className="muted">Minimal control panel</p>
        <nav>
          <a href="#brand">Brand</a>
          <a href="#schedule">Schedule</a>
          <a href="#create">Create</a>
          <a href="#approvals">Approvals</a>
          <a href="#accounts">Accounts</a>
          <a href="#history">History</a>
        </nav>
      </aside>
      <main className="content">
        {message && <div className="banner">{message}</div>}

        <SectionCard>
          <div className="header-row">
            <h2 id="brand">Brand setup</h2>
            <button onClick={runSchedules}>Run scheduler tick</button>
          </div>
          <form onSubmit={handleBrandCreate} className="grid-form">
            <input placeholder="Brand name" value={brandForm.name} onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })} />
            <textarea placeholder="Business summary" value={brandForm.businessSummary} onChange={(e) => setBrandForm({ ...brandForm, businessSummary: e.target.value })} />
            <input placeholder="Audience" value={brandForm.audience} onChange={(e) => setBrandForm({ ...brandForm, audience: e.target.value })} />
            <input placeholder="Tone" value={brandForm.tone} onChange={(e) => setBrandForm({ ...brandForm, tone: e.target.value })} />
            <input placeholder="Goals CSV" value={brandForm.goalsCsv} onChange={(e) => setBrandForm({ ...brandForm, goalsCsv: e.target.value })} />
            <input placeholder="Banned phrases CSV" value={brandForm.bannedPhrasesCsv} onChange={(e) => setBrandForm({ ...brandForm, bannedPhrasesCsv: e.target.value })} />
            <input placeholder="Required mentions CSV" value={brandForm.requiredMentionsCsv} onChange={(e) => setBrandForm({ ...brandForm, requiredMentionsCsv: e.target.value })} />
            <button type="submit">Create brand</button>
          </form>
          {createdBrandId && <p className="muted">Created brand ID: {createdBrandId}</p>}
        </SectionCard>

        <SectionCard>
          <h2 id="schedule">Recurring schedule</h2>
          <form onSubmit={handleScheduleCreate} className="grid-form">
            <input placeholder="Brand ID" value={scheduleForm.brandId} onChange={(e) => setScheduleForm({ ...scheduleForm, brandId: e.target.value })} />
            <input placeholder="Timezone" value={scheduleForm.timezone} onChange={(e) => setScheduleForm({ ...scheduleForm, timezone: e.target.value })} />
            <input placeholder="Days CSV, e.g. 1,3,5" value={scheduleForm.daysOfWeekCsv} onChange={(e) => setScheduleForm({ ...scheduleForm, daysOfWeekCsv: e.target.value })} />
            <input type="time" value={scheduleForm.localTime} onChange={(e) => setScheduleForm({ ...scheduleForm, localTime: e.target.value })} />
            <div className="checkboxes">
              {platformOptions.map((platform) => (
                <label key={platform}>
                  <input
                    type="checkbox"
                    checked={scheduleForm.platforms.includes(platform)}
                    onChange={(e) => setScheduleForm({
                      ...scheduleForm,
                      platforms: e.target.checked
                        ? [...scheduleForm.platforms, platform]
                        : scheduleForm.platforms.filter((item) => item !== platform)
                    })}
                  />
                  {platform}
                </label>
              ))}
            </div>
            <label><input type="checkbox" checked={scheduleForm.requireApproval} onChange={(e) => setScheduleForm({ ...scheduleForm, requireApproval: e.target.checked })} />Require approval</label>
            <button type="submit">Create schedule</button>
          </form>
        </SectionCard>

        <SectionCard>
          <h2 id="create">Create post</h2>
          <form onSubmit={handleGenerate} className="grid-form">
            <input placeholder="Brand ID" value={form.brandId} onChange={(e) => setForm({ ...form, brandId: e.target.value })} />
            <textarea placeholder="What do you want to post?" value={form.prompt} onChange={(e) => setForm({ ...form, prompt: e.target.value })} />
            <select value={form.postType} onChange={(e) => setForm({ ...form, postType: e.target.value as PostType })}>
              {postTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <div className="checkboxes">
              {platformOptions.map((platform) => (
                <label key={platform}>
                  <input
                    type="checkbox"
                    checked={form.platforms.includes(platform)}
                    onChange={(e) => setForm({
                      ...form,
                      platforms: e.target.checked
                        ? [...form.platforms, platform]
                        : form.platforms.filter((item) => item !== platform)
                    })}
                  />
                  {platform}
                </label>
              ))}
            </div>
            <label><input type="checkbox" checked={form.withImage} onChange={(e) => setForm({ ...form, withImage: e.target.checked })} />Generate image</label>
            <label><input type="checkbox" checked={form.requireApproval} onChange={(e) => setForm({ ...form, requireApproval: e.target.checked })} />Require approval</label>
            <input type="datetime-local" value={form.scheduledFor} onChange={(e) => setForm({ ...form, scheduledFor: e.target.value })} />
            <button type="submit">Generate</button>
          </form>
        </SectionCard>

        <SectionCard>
          <h2 id="approvals">Approval queue</h2>
          <div className="post-list">
            {approvals.map((post) => (
              <article className="post-item" key={post.id}>
                <div className="post-top"><strong>{post.postType}</strong><span>{post.status}</span></div>
                <p>{post.textMaster}</p>
                <div className="row-actions"><button onClick={() => approve(post.id)}>Approve</button></div>
              </article>
            ))}
            {!approvals.length && <p className="muted">No pending approvals.</p>}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 id="accounts">Connected accounts</h2>
          <form onSubmit={handleAccountSave} className="grid-form">
            <select value={platformForm.platform} onChange={(e) => setPlatformForm({ ...platformForm, platform: e.target.value as Platform })}>
              {platformOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <input placeholder="Account label" value={platformForm.accountLabel} onChange={(e) => setPlatformForm({ ...platformForm, accountLabel: e.target.value })} />
            <input placeholder="Access token" value={platformForm.accessToken} onChange={(e) => setPlatformForm({ ...platformForm, accessToken: e.target.value })} />
            <input placeholder="Refresh token (optional)" value={platformForm.refreshToken} onChange={(e) => setPlatformForm({ ...platformForm, refreshToken: e.target.value })} />
            <textarea placeholder={platformMetaPlaceholder(platformForm.platform)} value={platformForm.metaJson} onChange={(e) => setPlatformForm({ ...platformForm, metaJson: e.target.value })} />
            <p className="muted">{platformMetaHelp(platformForm.platform)}</p>
            <button type="submit">Save account</button>
          </form>
          <div className="post-list compact-list">
            {accounts.map((account) => (
              <article className="post-item" key={account.id}>
                <div className="post-top"><strong>{account.platform}</strong><span>{account.accountLabel}</span></div>
                <p className="muted">Token: {account.accessToken ?? 'not shown'}</p>
              </article>
            ))}
          </div>
        </SectionCard>

        <SectionCard>
          <h2 id="history">Post history</h2>
          <div className="post-list">
            {posts.map((post) => (
              <article className="post-item" key={post.id}>
                <div className="post-top"><strong>{post.postType}</strong><span>{post.status}</span></div>
                <p>{post.textMaster}</p>
                {post.imageUrl && <a className="muted" href={post.imageUrl} target="_blank" rel="noreferrer">Open image</a>}
                <div className="row-actions">
                  {(post.status === 'generated' || post.status === 'scheduled') && <button onClick={() => publish(post.id)}>Publish now</button>}
                  <button onClick={() => loadAttempts(post.id)}>View attempts</button>
                </div>
                {!!attempts[post.id]?.length && (
                  <div className="attempts">
                    {attempts[post.id].map((attempt) => (
                      <div className="attempt-item" key={attempt.id}>
                        <strong>{attempt.platform}</strong> - {attempt.status}
                        {attempt.errorMessage ? ` - ${attempt.errorMessage}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </SectionCard>
      </main>
    </div>
  );
}

function parseMetaJson(value: string) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('Platform meta must be a JSON object');
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid platform meta JSON';
    throw new Error(message || 'Invalid platform meta JSON');
  }
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function readError(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}


function platformMetaPlaceholder(platform: Platform) {
  switch (platform) {
    case 'meta_facebook':
      return '{"pageId":"..."}';
    case 'meta_instagram':
      return '{"instagramBusinessId":"..."}';
    case 'linkedin':
      return '{"authorUrn":"urn:li:person:..."}';
    case 'tiktok':
      return '{"openId":"...","videoUrl":"https://.../video.mp4","photoImages":["https://verified.example.com/photo1.jpg"],"privacyLevel":"SELF_ONLY","postMode":"DIRECT_POST"}';
    case 'youtube':
      return '{"videoUrl":"https://.../video.mp4","title":"Optional title","privacyStatus":"private"}';
    case 'x':
    default:
      return '{}';
  }
}

function platformMetaHelp(platform: Platform) {
  switch (platform) {
    case 'meta_facebook':
      return 'Meta Facebook supports text posts and image posts here; image posts use the Page photos endpoint and require meta.pageId.';
    case 'meta_instagram':
      return 'Meta Instagram is image-first here: requires meta.instagramBusinessId plus a reachable image URL; container status is polled before publish.';
    case 'linkedin':
      return 'LinkedIn image posting is prioritized here: requires meta.authorUrn, validates the remote image URL, uploads the image asset, then publishes the UGC post.';
    case 'tiktok':
      return 'TikTok supports BYO video via meta.openId + meta.videoUrl, and photo posts via imageUrl or meta.photoImages; optional meta.privacyLevel and meta.postMode.';
    case 'youtube':
      return 'YouTube currently uploads BYO video and accepts meta.videoUrl, optional meta.title, meta.description, meta.tags, meta.categoryId, and meta.privacyStatus.';
    case 'x':
    default:
      return 'X can post text and image media here; remote image URLs are validated and uploaded through the X media upload flow before tweeting.';
  }
}
