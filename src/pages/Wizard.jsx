import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Phone, CheckCircle, ChevronRight, User, Play } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import './Wizard.css';

const Wizard = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { setAssistantConfig } = useAppContext();

  const playAudio = (url, e) => {
    e.stopPropagation();
    const audio = new Audio(url);
    audio.play();
  };

  const [formData, setFormData] = useState({
    companyName: '',
    voice: 'Rachel (Female)',
    phoneNumber: '+31 20 808 1234'
  });

  const nextStep = () => setStep(prev => Math.min(prev + 1, 5));
  
  const finishSetup = () => {
    setAssistantConfig({
      companyName: formData.companyName || 'My Company',
      voice: formData.voice,
      phoneNumber: formData.phoneNumber
    });
    navigate('/dashboard');
  };

  return (
    <div className="wizard-container animate-fade-in">
      
      {/* Sidebar Progress */}
      <div className="wizard-sidebar glass-panel">
        <div className="wizard-logo">
          <Phone className="text-gradient" size={28} />
          <h2>AI Receptionist</h2>
        </div>
        <ul className="wizard-steps">
          <li className={step >= 1 ? "active" : ""}>
             <div className="step-circle">{step > 1 ? <CheckCircle size={16}/> : "1"}</div>
             <span>Business Intake</span>
          </li>
          <li className={step >= 2 ? "active" : ""}>
             <div className="step-circle">{step > 2 ? <CheckCircle size={16}/> : "2"}</div>
             <span>Persona & Voice</span>
          </li>
          <li className={step >= 3 ? "active" : ""}>
             <div className="step-circle">{step > 3 ? <CheckCircle size={16}/> : "3"}</div>
             <span>Phone Number</span>
          </li>
          <li className={step >= 4 ? "active" : ""}>
             <div className="step-circle">{step > 4 ? <CheckCircle size={16}/> : "4"}</div>
             <span>Test & Deploy</span>
          </li>
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="wizard-main">
        {step === 1 && (
          <div className="step-content animate-fade-in">
            <h1>Let's train your Assistant 🧠</h1>
            <p className="text-muted">Tell us about your business so the AI knows how to answer questions.</p>
            
            <div className="form-group">
              <label>Business Name</label>
              <input 
                type="text" 
                placeholder="e.g. Jansen Dental Care" 
                className="glass-input"
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>What are your business hours?</label>
              <input type="text" placeholder="Mon-Fri, 09:00 - 17:00" className="glass-input" />
            </div>
            <div className="form-group">
              <label>What should the AI do during a call?</label>
              <textarea placeholder="Answer questions about pricing and schedule an appointment..." rows="4" className="glass-input"></textarea>
            </div>
            
            <button className="btn-primary mt-auto" onClick={nextStep}>
              Continue <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-content animate-fade-in">
            <h1>Choose a Persona & Voice 🗣️</h1>
            <p className="text-muted">Powered by ElevenLabs for ultra-realistic speech.</p>
            
            <div className="selection-grid">
              <div 
                className={`selection-card ${formData.voice === 'Rachel (Female)' ? 'active' : ''} glass-panel`}
                onClick={() => setFormData({...formData, voice: 'Rachel (Female)'})}
              >
                <User size={32} color={formData.voice === 'Rachel (Female)' ? 'var(--primary)' : 'var(--text-muted)'}/>
                <h3>Jessica (Female)</h3>
                <p>Playful, bright, warm</p>
                <button 
                  className="btn-secondary small mt-2" 
                  onClick={(e) => playAudio('https://storage.googleapis.com/eleven-public-prod/premade/voices/cgSgspJ2msm6clMCkdW9/56a97bf8-b69b-448f-846c-c3a11683d45a.mp3', e)}
                ><Play size={14}/> Listen</button>
              </div>
              <div 
                className={`selection-card ${formData.voice === 'Marcus (Male)' ? 'active' : ''} glass-panel`}
                onClick={() => setFormData({...formData, voice: 'Marcus (Male)'})}
              >
                <User size={32} color={formData.voice === 'Marcus (Male)' ? 'var(--secondary)' : 'var(--text-muted)'}/>
                <h3>Eric (Male)</h3>
                <p>Smooth, trustworthy</p>
                <button 
                  className="btn-secondary small mt-2"
                  onClick={(e) => playAudio('https://storage.googleapis.com/eleven-public-prod/premade/voices/cjVigY5qzO86Huf0OWal/d098fda0-6456-4030-b3d8-63aa048c9070.mp3', e)}
                ><Play size={14}/> Listen</button>
              </div>
            </div>

            <div className="form-group mt-4">
              <label>Greeting Message</label>
              <input type="text" defaultValue={`Hi! Thanks for calling ${formData.companyName || 'us'}. How can I help you today?`} className="glass-input" />
            </div>

            <button className="btn-primary mt-auto" onClick={nextStep}>
              Select Voice <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="step-content animate-fade-in">
            <h1>Claim your Phone Number 📞</h1>
            <p className="text-muted">Choose a local number via Twilio where your customers can call.</p>
            
            <div className="number-list">
              <div 
                className={`number-row glass-panel ${formData.phoneNumber === '+31 20 808 1234' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, phoneNumber: '+31 20 808 1234'})}
              >
                <span className="phone-number">+31 20 808 1234</span>
                <span className="location">Amsterdam, NL</span>
                {formData.phoneNumber === '+31 20 808 1234' ? <CheckCircle color="var(--primary)" /> : <span>Select</span>}
              </div>
              <div 
                className={`number-row glass-panel ${formData.phoneNumber === '+31 10 345 6789' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, phoneNumber: '+31 10 345 6789'})}
              >
                <span className="phone-number">+31 10 345 6789</span>
                <span className="location">Rotterdam, NL</span>
                {formData.phoneNumber === '+31 10 345 6789' ? <CheckCircle color="var(--primary)" /> : <span>Select</span>}
              </div>
              <div 
                className={`number-row glass-panel ${formData.phoneNumber === '+31 85 999 0000' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, phoneNumber: '+31 85 999 0000'})}
              >
                <span className="phone-number">+31 85 999 0000</span>
                <span className="location">National, NL</span>
                {formData.phoneNumber === '+31 85 999 0000' ? <CheckCircle color="var(--primary)" /> : <span>Select</span>}
              </div>
            </div>

            <button className="btn-primary mt-auto" onClick={nextStep}>
              Claim Number <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="step-content animate-fade-in center-content">
            <h1>Your Assistant is Ready! 🎉</h1>
            <p className="text-muted text-center mb-4">Try calling your assistant right now from your browser.</p>
            
            <div className="call-simulator glass-panel">
               <div className="avatar glow-pulse"><Mic size={40} color="white"/></div>
               <h2 className="mt-4">{formData.voice.split(' ')[0]} is listening...</h2>
               <p className="text-primary mt-2">"Hi! Thanks for calling {formData.companyName || 'us'}. How can I help?"</p>
               
               <button className="btn-secondary mt-4">End Test Call</button>
            </div>

            <button className="btn-primary mt-4 w-full" onClick={finishSetup}>
              Deploy & Go to Dashboard <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wizard;
