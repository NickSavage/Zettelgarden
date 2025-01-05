import React, { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import landingImage from "../assets/landing.png";
import { GithubIcon } from "../assets/icons/GithubIcon";
import { TwitterIcon } from "../assets/icons/TwitterIcon";
import { LandingHeader } from "./LandingHeader";
import { RecentBlogPosts } from "./RecentBlogPosts";
import { addToMailingList } from "../api/users";

function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSignUp() {
    navigate("/app");
  }

  async function handleSubmit() {
    console.log(email);
    addToMailingList(email);
    setSubmitted(true);
  }

  useEffect(() => {
    document.title = "Zettelgarden"
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-green-50">
      <div className="w-full py-2 mx-auto max-w-screen-xl flex items-center px-4 sm:px-6 lg:px-8">
        <div className="w-full">
          <LandingHeader />
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col lg:flex-row gap-12 items-center mt-8">
            <div className="lg:w-6/12 space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
                Plant Your Thoughts, Cultivate Your Ideas
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Zettelgarden is an open-source personal knowledge management system 
                that preserves human insight while leveraging modern technology. 
                Built on zettelkasten principles, it helps you develop and maintain 
                your own understanding of the world.
              </p>

              <button 
                onClick={handleSignUp} 
                className="px-8 py-4 bg-green-600 text-white rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                Get Started with Zettelgarden
              </button>
            </div>
            <motion.div 
              className="lg:w-6/12"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}>
              <img
                src={landingImage}
                alt="Zettelgarden interface preview"
                className="w-full rounded-xl shadow-2xl"
              />
            </motion.div>
          </motion.div>

          <div id="features" className="py-24 space-y-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Thoughtful AI Integration</h2>
                <p className="text-gray-600 leading-relaxed">
                  While other tools rush to automate everything with LLMs, Zettelgarden 
                  takes a measured approach. AI features are designed to augment your 
                  thinking process, not replace it. Find connections and patterns while 
                  maintaining the critical human element of knowledge management.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Human-Centric Knowledge Organization</h2>
                <p className="text-gray-600 leading-relaxed">
                  Create and connect atomic notes that reflect your understanding, not 
                  just store information. Built on time-tested zettelkasten principles, 
                  Zettelgarden helps you develop genuine insights rather than just 
                  collecting automated summaries.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Built for Scale</h2>
                <p className="text-gray-600 leading-relaxed">
                  Whether you're managing personal notes or building a company 
                  knowledge base, Zettelgarden is designed to grow with you. 
                  Powerful linking and organization features help maintain clarity 
                  even as your knowledge base expands.
                </p>
              </div>
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900">Open Source and Transparent</h2>
                <p className="text-gray-600 leading-relaxed">
                  Zettelgarden is built in the open, using TypeScript and Go, with an 
                  experimental iOS app in Swift. Your knowledge belongs to you - no 
                  vendor lock-in, no black boxes, just clean, efficient knowledge 
                  management.
                </p>
              </div>
            </motion.div>
          </div>

          <RecentBlogPosts />

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="py-16 bg-green-50 rounded-2xl px-8 text-center">
            <h2 className="text-2xl font-bold mb-6">Stay Updated</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Stay updated with Zettelgarden's development. Sign up for occasional 
              updates about new features and releases.
            </p>
            {!submitted ? (
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button 
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200">
                  Sign Up
                </button>
              </div>
            ) : (
              <p className="text-green-600 font-semibold">Thank you for signing up!</p>
            )}
          </motion.div>

          <footer className="flex flex-col sm:flex-row items-center justify-between py-12 mt-12 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <Link to="" className="hover:text-gray-900">Terms of Service</Link>
              <Link to="" className="hover:text-gray-900">Privacy Policy</Link>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <a 
                href="https://github.com/NickSavage/Zettelgarden"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <GithubIcon />
              </a>
              <a 
                href="https://twitter.com/impossibilium"
                className="text-gray-600 hover:text-gray-900 transition-colors duration-200">
                <TwitterIcon />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
