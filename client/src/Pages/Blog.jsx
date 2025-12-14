// client/src/pages/Blog.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { assets } from '../assets/assets';
import Navbar from '../components/Navbar';
import Moment from 'moment';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import FeatureMenu from '../components/FeatureMenu';
import {
  Volume2,
  StopCircle,
  Share2,
  Sparkles,
  Copy,
  Check,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Blog = () => {
  const { id } = useParams();
  const { axios, theme } = useAppContext();
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);

  // --- UI / TTS state
  const [isSpeaking, setIsSpeaking] = useState(false); // browser TTS
  const [isPlayingHQ, setIsPlayingHQ] = useState(false); // server HQ audio
  const audioRef = useRef(null);

  // voices
  const [voicesList, setVoicesList] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState(() => {
    try {
      return localStorage.getItem('blogVoice') || '';
    } catch (e) {
      return '';
    }
  });

  // AI Summary state (compact)
  const [summary, setSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // comment form
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const { user } = useAppContext();
  const { openLogin } = useAuth();

  // translations (kept small; use 'en' by default)
  const translations = {
    en: {
      listen_start: 'Listen',
      listen_stop: 'Stop',
      ai_summary_btn: 'AI Summary',
      ai_generating: 'Generating...',
      ai_ready: 'Summary Ready',
      ai_generated_heading: 'AI Summary',
      ai_summary_generated_toast: 'Summary ready!',
      comment_added: 'Comment Added!',
      comment_failed: 'Failed to add comment',
      fetch_comments_failed: 'Failed to fetch comments',
      link_copied: 'Link copied to clipboard',
      discussion: 'Discussion',
      leave_comment: 'Leave a comment',
      your_name: 'Your Name',
      share_thoughts_placeholder: 'Share your thoughts...',
      post_comment: 'Post Comment',
      no_comments: 'No comments yet. Be the first to share your thoughts!',
      share_article: 'Share this article'
    }
  };
  const lang = 'en';
  const t = translations[lang];

  // --- fetch blog + comments
  useEffect(() => {
    fetchBlogData();
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchBlogData = async () => {
    try {
      const res = await axios.get(`/api/add/blog/${id}`);
      if (res.data?.success) setData(res.data.blog);
      else toast.error(res.data?.message || 'Failed to load blog');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to load blog');
    }
  };

  const fetchComments = async () => {
    try {
      const res = await axios.post('/api/add/comments', { blogId: id });
      if (res.data?.success) setComments(res.data.comment || []);
      else toast.error(t.fetch_comments_failed);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t.fetch_comments_failed);
    }
  };

  // --- comments
  const addComment = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please login to comment');
      openLogin();
      return;
    }
    try {
      const res = await axios.post('/api/add/add-comment', { blog: id, name, content });
      if (res.data?.success) {
        setName('');
        setContent('');
        toast.success(t.comment_added);
        fetchComments();
      } else toast.error(res.data?.message || t.comment_failed);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || t.comment_failed);
    }
  };

  // --- voices load
  useEffect(() => {
    const updateVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices() || [];
        setVoicesList(v);
      } catch (e) {
        setVoicesList([]);
      }
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
  }, []);

  const handleVoiceSelect = (e) => {
    const name = e.target.value;
    setSelectedVoiceName(name);
    try {
      localStorage.setItem('blogVoice', name);
    } catch (err) {}
  };

  // --- Helper: choose a female English voice (best-effort)
  const pickFemaleEnglishVoice = (list = []) => {
    if (!list || !list.length) return null;
    // prefer en-US first, then en
    const enUS = list.filter(v => v.lang && v.lang.toLowerCase().startsWith('en-us'));
    const en = list.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    // If user selected voice, prefer it
    if (selectedVoiceName) {
      const sel = list.find(v => v.name === selectedVoiceName);
      if (sel) return sel;
    }
    const femalePreferredNames = ['Samantha','Joanna','Emma','Olivia','Amy','Ivy','Alloy','Google US English','Kendra','Nicole','Aria'];
    const findIn = (arr) => {
      for (const name of femalePreferredNames) {
        const f = arr.find(v => v.name && v.name.toLowerCase().includes(name.toLowerCase()));
        if (f) return f;
      }
      return null;
    };
    // try enUS female
    const f1 = findIn(enUS);
    if (f1) return f1;
    // try en female
    const f2 = findIn(en);
    if (f2) return f2;
    // fallback to first enUS, then en, then any female-ish by name heuristic
    if (enUS.length) return enUS[0];
    if (en.length) return en[0];
    const femaleHeuristic = list.find(v => /female|woman|sara|emma|olivia|amy|joanna|samantha|kendra|nicole/i.test(v.name));
    if (femaleHeuristic) return femaleHeuristic;
    return list[0];
  };

  // --- Browser TTS (chunked) with female voice preference
  const speakBrowser = async (text) => {
    if (!text) return;
    // Stop if already speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // sanitize
    let raw = text.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&quot;|&#39;/g, ' ');
    raw = raw.replace(/\s+/g, ' ').trim();
    const fullText = `${data?.title ? data.title + '. ' : ''}${raw}`;

    // split to sentences reasonably
    const splitRegex = /(?<=[.?!])\s+(?=[A-Z0-9])/g;
    let chunks = fullText.split(splitRegex).map(s => s.trim()).filter(Boolean);

    // still safe limit: if too long, chunk by ~450 chars
    const maxChunk = 450;
    const finalChunks = [];
    for (let c of chunks) {
      if (c.length <= maxChunk) finalChunks.push(c);
      else {
        // split long chunk
        for (let i = 0; i < c.length; i += maxChunk) {
          finalChunks.push(c.slice(i, i + maxChunk));
        }
      }
    }

    // choose voice
    const voicesNow = voicesList.length ? voicesList : window.speechSynthesis.getVoices();
    const voice = pickFemaleEnglishVoice(voicesNow);

    let index = 0;
    let canceled = false;
    const speakNext = () => {
      if (canceled || index >= finalChunks.length) {
        setIsSpeaking(false);
        return;
      }
      const u = new SpeechSynthesisUtterance(finalChunks[index]);
      u.lang = 'en-US';
      u.rate = 0.98;
      u.pitch = 1.05; // slightly higher for female tone
      if (voice) u.voice = voice;

      u.onend = () => {
        index++;
        setTimeout(speakNext, 180);
      };
      u.onerror = (err) => {
        console.error('TTS chunk error', err);
        setIsSpeaking(false);
      };

      try {
        window.speechSynthesis.speak(u);
        setIsSpeaking(true);
      } catch (err) {
        console.error('TTS speak error', err);
        setIsSpeaking(false);
      }
    };

    // start
    window.speechSynthesis.cancel();
    speakNext();

    // expose stop
    window.__blogTtsStop = () => {
      canceled = true;
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    };
  };

  // --- High-quality server TTS handler (unchanged semantics, improved handling)
  const handleHighQualityTTS = async () => {
    if (!data) return;

    if (isPlayingHQ) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingHQ(false);
      return;
    }

    // prepare plain text
    let raw = data.description.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&amp;|&quot;|&#39;/g, ' ').replace(/\s+/g, ' ').trim();
    const textToSend = `${data.title}. ${raw}`.slice(0, 20000); // cap size

    try {
      setIsPlayingHQ(true);
      const resp = await axios.post('/api/ai/tts', { text: textToSend, language: 'en' });
      if (!resp?.data?.success) {
        toast.error(resp?.data?.message || 'Failed to generate AI voice');
        setIsPlayingHQ(false);
        return;
      }

      const url = `${axios.defaults.baseURL || ''}${resp.data.downloadUrl}`;
      if (audioRef.current) audioRef.current.src = url;
      else audioRef.current = new Audio(url);

      audioRef.current.onended = () => setIsPlayingHQ(false);
      audioRef.current.onerror = (e) => {
        console.error('Audio play error', e);
        setIsPlayingHQ(false);
        toast.error('Failed to play AI voice; falling back to browser TTS');
      };
      await audioRef.current.play();
      setIsPlayingHQ(true);
    } catch (err) {
      console.error('HQ TTS error', err);
      setIsPlayingHQ(false);
      const status = err?.response?.status;
      if (status === 501) {
        toast.error('High quality TTS unavailable — using browser voice.');
        // fallback to browser
        try {
          await speakBrowser(data.description);
        } catch (e) {
          console.error('fallback error', e);
          toast.error('Fallback TTS failed');
        }
      } else {
        toast.error(err?.message || 'High quality TTS failed');
      }
    }
  };

  // cleanup audio + speech on unmount
  useEffect(() => {
    return () => {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
      if (audioRef.current) {
        try { audioRef.current.pause(); audioRef.current.src = ''; } catch (e) {}
      }
    };
  }, []);

  // --- AI Summary (compact box)
  const generateSummary = async () => {
    if (!data || isGeneratingSummary) return;
    setIsGeneratingSummary(true);

    try {
      const res = await axios.post('/api/ai/summary', { title: data.title, content: data.description });
      if (res.data?.success && res.data.summary) {
        // summary might be text or array; make compact string/array
        const s = res.data.summary;
        // if long text, try to split into 3 points
        if (typeof s === 'string') {
          // split into sentences and keep top 3
          const sentences = s.split(/(?<=[.?!])\s+/).filter(Boolean);
          const top = sentences.slice(0, 3);
          setSummary(top.length > 1 ? top : s);
        } else {
          setSummary(s);
        }
        toast.success(t.ai_summary_generated_toast);
      } else {
        toast.error('Summary generation failed');
      }
    } catch (err) {
      console.error('Summary error', err);
      toast.error(err?.message || 'Summary failed');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleListenSummary = () => {
    if (!summary) return;
    // stop if speaking
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    // prepare summary text
    const text = Array.isArray(summary) ? summary.join('. ') : String(summary);
    speakBrowser(text);
  };

  // --- share / copy
  const [isCopied, setIsCopied] = useState(false);
  const handleShare = (platform) => {
    if (!data) return;
    const url = window.location.href;
    const text = `Check out this article: ${data.title}`;
    if (platform === 'copy') {
      try {
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        toast.success(t.link_copied);
      } catch (e) {
        toast.error('Copy failed');
      }
      return;
    }
    let shareUrl = '';
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    if (shareUrl) window.open(shareUrl, '_blank');
  };

  if (!data) return <Loader />;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800 transition-colors duration-300 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-400/5 to-orange-300/5 pointer-events-none"></div>
      <div className="absolute -top-32 -right-20 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl dark:bg-purple-700/5"></div>
      <div className="absolute bottom-1/4 -left-32 w-80 h-80 bg-pink-300/10 rounded-full blur-3xl dark:bg-pink-700/5"></div>

      <div className="relative z-10">
        <Navbar />
        <FeatureMenu blogTitle={data.title} blogContent={data.description} />

        <div className="mx-5 max-w-4xl md:mx-auto my-10">
          {data.image && (
            <div className="relative group mb-8">
              <img
                src={data.image}
                alt={data.title}
                className="w-full h-[380px] object-cover rounded-2xl shadow-md transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-6 sticky top-20 z-20">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => speakBrowser(data.description)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${
                  isSpeaking ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={isSpeaking ? t.listen_stop : t.listen_start}
              >
                {isSpeaking ? <StopCircle size={16} /> : <Volume2 size={16} />}
                <span className="hidden sm:inline">{isSpeaking ? t.listen_stop : t.listen_start}</span>
              </button>

              <button
                onClick={handleHighQualityTTS}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${
                  isPlayingHQ ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title="High quality AI voice (server)"
              >
                {isPlayingHQ ? <Pause size={16} /> : <Sparkles size={16} />}
                <span className="hidden sm:inline">AI Voice</span>
              </button>

              {/* voice selector */}
              <select
                value={selectedVoiceName}
                onChange={handleVoiceSelect}
                className="ml-2 p-2 bg-gray-50 border border-gray-200 rounded-md text-sm"
                title="Choose voice (browser)"
              >
                <option value="">Default (female preferred)</option>
                {voicesList
                  .filter(v => v.lang && v.lang.toLowerCase().startsWith('en'))
                  .map(v => <option key={v.name} value={v.name}>{`${v.name} (${v.lang})`}</option>)}
              </select>

              <button
                onClick={generateSummary}
                disabled={isGeneratingSummary || !!summary}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition ${
                  summary ? 'bg-purple-50 text-purple-700' : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                <Sparkles size={14} />
                <span>{isGeneratingSummary ? t.ai_generating : (summary ? t.ai_ready : t.ai_summary_btn)}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <button onClick={() => handleShare('copy')} className="p-2 hover:bg-gray-100 rounded-full">
                {isCopied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
              </button>
              <button onClick={() => handleShare('twitter')} className="p-2 hover:bg-purple-50 rounded-full text-purple-400">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {/* compact AI Summary */}
          {summary && (
            <div className="bg-white border border-gray-200 p-5 rounded-xl mb-6 shadow-sm max-w-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles size={18} /> {t.ai_generated_heading}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">A short AI-generated summary (quick view).</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleListenSummary} className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                    <Volume2 size={14} /> <span className="ml-2">Listen</span>
                  </button>
                  <button onClick={() => setSummary('')} className="px-3 py-2 bg-gray-100 rounded-md text-sm">Close</button>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {Array.isArray(summary) ? (
                  summary.map((s, i) => (
                    <div key={i} className="text-gray-700 text-sm">
                      <strong className="text-purple-700 mr-2">{i + 1}.</strong> {s}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-700 text-sm">{summary}</p>
                )}
              </div>
            </div>
          )}

          {/* Blog content */}
          <div className="prose prose-lg max-w-none dark:prose-invert text-gray-700 leading-8">
            <div dangerouslySetInnerHTML={{ __html: data.description }} />
          </div>

          {/* Comments */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-12 pt-8">
            <h3 className="text-2xl font-bold mb-6">{t.discussion} ({comments?.filter(c => c.isApproved)?.length || 0})</h3>

            <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 mb-8">
              {!user ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <p className="text-gray-700 mb-3">Please log in to share your thoughts</p>
                  <button
                    onClick={openLogin}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 inline-block"
                  >
                    Login to Comment
                  </button>
                </div>
              ) : (
              <form onSubmit={addComment} className="space-y-4">
                <div className="flex gap-4 items-center">
                  <img src={assets.user_icon} alt="user" className="w-10 h-10 rounded-full bg-gray-200 p-1" />
                  <input
                    type="text"
                    placeholder={t.your_name}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <textarea
                  placeholder={t.share_thoughts_placeholder}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                  className="w-full h-28 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                />
                <div className="flex justify-end">
                  <button type="submit" className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700"> {t.post_comment} </button>
                </div>
              </form>
              )}
            </div>

            <div className="space-y-6">
              {comments?.filter(c => c.isApproved).length > 0 ? (
                comments.filter(c => c.isApproved).map(item => (
                  <div key={item._id} className="flex gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm">
                    <img src={assets.user_icon} alt="user" className="w-10 h-10 opacity-80 rounded-full" />
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <span className="text-xs text-gray-400">{Moment(item.createdAt).fromNow()}</span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200">{item.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 py-8">{t.no_comments}</p>
              )}
            </div>
          </div>

          {/* Share Footer */}
          <div className="mt-12 border-t border-gray-200 pt-8 text-center">
            <p className="text-gray-500 mb-4">{t.share_article}</p>
            <div className="flex justify-center gap-6">
              <button onClick={() => handleShare('facebook')} className="transition-transform hover:scale-105">
                <img src={assets.facebook_icon} width={40} alt="facebook" />
              </button>
              <button onClick={() => handleShare('twitter')} className="transition-transform hover:scale-105">
                <img src={assets.twitter_icon} width={40} alt="twitter" />
              </button>
              <button onClick={() => handleShare('copy')} className="transition-transform hover:scale-105">
                <img src={assets.googleplus_icon} width={40} alt="copy link" />
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
};

export default Blog;
