import React, { useState } from 'react'
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const Newsletter = () => {
  const [email, setEmail] = useState('')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { axios, user } = useAppContext();
  const { openLogin } = useAuth();

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to subscribe')
      openLogin()
      return
    }

    if (!email || isLoading) return;

    setIsLoading(true);
    try {
      const resp = await axios.post('/api/subscribe', { email });
      if (resp.data && resp.data.success) {
        toast.success(resp.data.message || 'Thanks for subscribing! Check your email.');
        setIsSubscribed(true);
        setEmail('');
        // Reset subscribed state after 3 seconds
        setTimeout(() => setIsSubscribed(false), 3000);
      } else {
        toast.error(resp.data?.message || 'Subscription failed');
      }
    } catch (err) {
      console.error('Subscribe error', err);
      const errMsg = err.response?.data?.message || err.message || 'Subscription failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 my-32">
      <div className="relative rounded-3xl p-12 overflow-hidden
        bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400
        shadow-2xl">

        {/* Soft Grid Background */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,white_1px,transparent_1px)] [background-size:24px_24px]"></div>

        {/* Glow Effects */}
        <div className="absolute -top-32 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-24 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 text-center flex flex-col items-center">

          {/* Icon Badge */}
          <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl mb-6 shadow-lg hover:bg-white/30 transition-all">
            <Mail className="w-7 h-7 text-white" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Never Miss a Beat
          </h1>

          <p className="text-white/90 max-w-xl mt-4 mb-10 text-lg leading-relaxed font-medium">
            Join 10,000+ developers getting weekly tips, deep-dives, and AI-powered blogging insights delivered straight to your inbox.
          </p>

          {/* Subscribed State */}
          {isSubscribed ? (
            <div className="flex items-center gap-3 bg-white/15 px-6 py-4 rounded-2xl 
              border border-white/20 text-white backdrop-blur-md animate-fade-in">
              <CheckCircle2 className="w-6 h-6 text-green-300" />
              <span className="font-medium">You're subscribed! Check your inbox.</span>
            </div>
          ) : (
            <form onSubmit={onSubmitHandler} className="w-full max-w-md flex flex-col sm:flex-row gap-3">

              {/* Email Input */}
              <div className="relative flex-grow">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/80 w-5 h-5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-white/20 border border-white/30 rounded-xl outline-none
                    text-white placeholder-white/70 shadow-lg shadow-black/10
                    focus:ring-4 focus:ring-white/40 transition-all backdrop-blur-sm"
                />
              </div>

              {/* Subscribe Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 rounded-xl font-bold
                  bg-white/95 text-purple-700 disabled:opacity-60 disabled:cursor-not-allowed
                  hover:scale-[1.03] active:scale-[0.97] shadow-lg transition-all
                  transition-all shadow-lg flex items-center justify-center gap-2"
              >
                {isLoading ? 'Subscribing...' : 'Subscribe'} {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          )}

          <p className="text-white/50 text-xs mt-6">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Newsletter
