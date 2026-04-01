import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Monitor, User, Lock, Bell, Trash2, Loader2, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authService } from '@/services/authService';
import toast from 'react-hot-toast';

const Section = ({ title, description, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="card p-6 space-y-5"
  >
    <div>
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
      {description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
    </div>
    <div className="border-t border-surface-border dark:border-dark-border pt-5">
      {children}
    </div>
  </motion.div>
);

const ThemeButton = ({ value, icon: Icon, label, current, onClick }) => (
  <button
    onClick={() => onClick(value)}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all border
      ${current === value
        ? 'bg-brand-500 text-white border-brand-500 shadow-brand'
        : 'border-surface-border dark:border-dark-border text-gray-600 dark:text-gray-400 hover:border-brand-300'
      }`}
  >
    <Icon size={15} /> {label}
  </button>
);

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const handleThemeSelect = (t) => {
    if (t !== theme) toggleTheme();
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name cannot be empty');
    setProfileLoading(true);
    try {
      const { data } = await authService.updateProfile({ name: profileForm.name.trim() });
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match');
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setPwLoading(true);
    try {
      await authService.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed! Please log in again.');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account and preferences.</p>
      </div>

      {/* Appearance */}
      <Section title="Appearance" description="Choose how TaskFlow looks for you.">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Theme</p>
          <div className="flex gap-3 flex-wrap">
            <ThemeButton value="light"  icon={Sun}     label="Light"  current={theme} onClick={handleThemeSelect} />
            <ThemeButton value="dark"   icon={Moon}    label="Dark"   current={theme} onClick={handleThemeSelect} />
            <ThemeButton value="system" icon={Monitor} label="System" current={theme} onClick={handleThemeSelect} />
          </div>
        </div>
      </Section>

      {/* Profile */}
      <Section title="Profile" description="Update your display name and public info.">
        <form onSubmit={handleProfileSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Display Name
            </label>
            <input
              className="input-field"
              value={profileForm.name}
              onChange={(e) => setProfileForm({ name: e.target.value })}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Email
            </label>
            <input className="input-field opacity-60 cursor-not-allowed" value={user?.email || ''} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
          </div>
          <button type="submit" disabled={profileLoading} className="btn-primary">
            {profileLoading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Save Changes
          </button>
        </form>
      </Section>

      {/* Password */}
      <Section title="Change Password" description="Keep your account secure with a strong password.">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: '••••••••' },
            { key: 'newPassword',     label: 'New Password',     placeholder: 'Min 8 chars, upper + lower + number' },
            { key: 'confirm',         label: 'Confirm New Password', placeholder: '••••••••' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
              <input
                type="password"
                className="input-field"
                value={pwForm[key]}
                onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                required
              />
            </div>
          ))}
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
            Update Password
          </button>
        </form>
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" description="Irreversible actions — proceed with caution.">
        <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-400">Delete Account</p>
            <p className="text-xs text-red-500/80 dark:text-red-500/60 mt-0.5">
              Permanently delete your account and all data.
            </p>
          </div>
          <button
            className="btn-danger text-sm"
            onClick={() => toast.error('Contact support to delete your account.')}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </Section>
    </div>
  );
}
