import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Code, Edit, GraduationCap, Globe, Mail, User, Briefcase, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAsync } from '../../hooks/useAsync';
import { ErrorMessage, LoadingSpinner } from '../../components/ui/shared';

interface StudentProfileRecord {
  id?: string;
  name?: string;
  email?: string;
  idNumber?: string;
  program?: string;
  year?: string;
  yearLevel?: string | number;
  status?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  skills?: string;
  organizations?: string;
  image?: string;
  photoURL?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface StudentProfileForm {
  name: string;
  email: string;
  idNumber: string;
  program: string;
  year: string;
  status: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  skills: string;
  organizations: string;
  image: string;
}

const emptyProfile: StudentProfileForm = {
  name: '',
  email: '',
  idNumber: '',
  program: '',
  year: '',
  status: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  skills: '',
  organizations: '',
  image: '',
};

const toProfileForm = (record: StudentProfileRecord | null, fallbackName = '', fallbackEmail = ''): StudentProfileForm => ({
  name: record?.name || fallbackName || '',
  email: record?.email || fallbackEmail || '',
  idNumber: record?.idNumber || '',
  program: record?.program || '',
  year: record?.year || String(record?.yearLevel ?? ''),
  status: record?.status || '',
  phone: record?.phone || '',
  address: record?.address || '',
  dateOfBirth: record?.dateOfBirth || '',
  skills: record?.skills || '',
  organizations: record?.organizations || '',
  image: record?.image || record?.photoURL || '',
});

export const StudentProfile: React.FC = () => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [profile, setProfile] = useState<StudentProfileForm>(emptyProfile);
  const [tempProfile, setTempProfile] = useState<StudentProfileForm>(emptyProfile);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useMemo(
    () => async () => {
      if (!user?.id) return null;
      try {
        const response = await fetch(`http://localhost:8080/student/${user.id}/profile`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error('Failed to fetch profile');
        }
        return (await response.json()) as StudentProfileRecord;
      } catch (error) {
        if (error instanceof Error && error.message === 'Record not found') {
          return null;
        }
        throw error;
      }
    },
    [user?.id]
  );

  const { data: studentRecord, loading, error, execute } = useAsync<StudentProfileRecord | null>(fetchProfile, false);

  useEffect(() => {
    if (user?.id) {
      execute();
    } else {
      const fallbackProfile = toProfileForm(null, user?.name || '', user?.email || '');
      setProfile(fallbackProfile);
      setTempProfile(fallbackProfile);
    }
  }, [execute, user?.email, user?.id, user?.name]);

  useEffect(() => {
    const nextProfile = toProfileForm(studentRecord, user?.name || '', user?.email || '');
    setProfile(nextProfile);
    setTempProfile(nextProfile);
  }, [studentRecord, user?.email, user?.name]);

  const displayedProfile = isEditing ? tempProfile : profile;
  const avatarSource = displayedProfile.image || user?.photoURL || '';
  const initials = (displayedProfile.name || user?.name || 'Student')
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleChange = (field: keyof StudentProfileForm, value: string) => {
    setTempProfile((previous) => ({ ...previous, [field]: value }));
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setTempProfile((previous) => ({ ...previous, image: String(reader.result || '') }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleRemoveImage = () => {
    setTempProfile((previous) => ({ ...previous, image: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      window.alert('Student account not found.');
      return;
    }

    setIsSaving(true);
    try {
      const normalizedProfile = {
        ...tempProfile,
        name: tempProfile.name.trim(),
        email: tempProfile.email.trim().toLowerCase(),
        idNumber: tempProfile.idNumber.trim(),
        program: tempProfile.program.trim(),
        year: tempProfile.year.trim(),
        status: tempProfile.status.trim(),
        phone: tempProfile.phone.trim(),
        address: tempProfile.address.trim(),
        dateOfBirth: tempProfile.dateOfBirth,
        skills: tempProfile.skills.trim(),
        organizations: tempProfile.organizations.trim(),
        image: tempProfile.image,
      };

      const response = await fetch(`http://localhost:8080/student/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedProfile),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || 'Unable to save student profile.');
      }

      const refreshedProfile = toProfileForm({ ...normalizedProfile, id: user.id }, user.name, user.email);
      setProfile(refreshedProfile);
      setTempProfile(refreshedProfile);
      setIsEditing(false);
      void execute();
    } catch (saveError: any) {
      console.error('Profile save error:', saveError);
      window.alert(saveError?.message || 'Unable to save student profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  if (loading && !displayedProfile.name && !user?.name) {
    return <LoadingSpinner text="Loading student profile..." fullScreen />;
  }

  return (
    <div style={styles.container}>
      {error && <ErrorMessage message="Failed to load the student profile." />}

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.profileMeta}>
            <div
              style={{
                ...styles.avatarFrame,
                border: isEditing ? (isDragging ? '3px solid #fb923c' : '3px dashed #cbd5e1') : 'none',
              }}
              onDragOver={isEditing ? (event) => { event.preventDefault(); setIsDragging(true); } : undefined}
              onDragLeave={isEditing ? () => setIsDragging(false) : undefined}
              onDrop={isEditing ? handleDrop : undefined}
            >
              <div style={styles.avatarMain} onClick={isEditing ? () => fileInputRef.current?.click() : undefined}>
                {avatarSource ? (
                  <img src={avatarSource} alt="Profile" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>{initials}</div>
                )}
                {isEditing && <div style={styles.avatarHover}><Camera size={20} color="#fff" /></div>}
              </div>

              {isEditing && tempProfile.image && (
                <button onClick={handleRemoveImage} style={styles.imageDeleteBtn} type="button">
                  <X size={10} />
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </div>

            <div style={styles.titleInfo}>
              <h1 style={styles.nameDisplay}>{displayedProfile.name || user?.name || 'Student Profile'}</h1>
              <div style={styles.badgeRow}>
                <span style={styles.pillBadge}><GraduationCap size={14} /> {displayedProfile.program || 'Program not set'}</span>
                <span style={styles.pillBadge}><Globe size={14} /> {displayedProfile.address || 'Address not set'}</span>
              </div>
            </div>
          </div>

          <div style={styles.actionSlot}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={styles.editTrigger} type="button">
                <Edit size={16} /> Edit Details
              </button>
            ) : (
              <div style={styles.buttonSet}>
                <button onClick={handleCancel} style={styles.ghostBtn} type="button" disabled={isSaving}>
                  Cancel
                </button>
                <button onClick={handleSave} style={styles.primaryBtn} type="button" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main style={styles.formContainer}>
        <div style={styles.grid}>
          <section style={styles.gridCard}>
            <h3 style={styles.cardHeader}><User size={18} color="#f97316" /> Identity Profile</h3>
            <div style={styles.inputStack}>
              <div style={styles.field}>
                <label style={styles.label}>Full Legal Name</label>
                <input
                  value={tempProfile.name}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('name', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Student ID</label>
                <input value={tempProfile.idNumber} disabled style={styles.inputLocked} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Date of Birth</label>
                <input
                  type="date"
                  value={tempProfile.dateOfBirth}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('dateOfBirth', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
            </div>
          </section>

          <section style={styles.gridCard}>
            <h3 style={styles.cardHeader}><Mail size={18} color="#f97316" /> Communication</h3>
            <div style={styles.inputStack}>
              <div style={styles.field}>
                <label style={styles.label}>Institutional Email</label>
                <input
                  value={tempProfile.email}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('email', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mobile Number</label>
                <input
                  value={tempProfile.phone}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('phone', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Address</label>
                <input
                  value={tempProfile.address}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('address', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
            </div>
          </section>

          <section style={styles.gridCard}>
            <h3 style={styles.cardHeader}><GraduationCap size={18} color="#f97316" /> Academic Details</h3>
            <div style={styles.inputStack}>
              <div style={styles.field}>
                <label style={styles.label}>Program</label>
                <input
                  value={tempProfile.program}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('program', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Year Level</label>
                <input
                  value={tempProfile.year}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('year', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Status</label>
                <input
                  value={tempProfile.status}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('status', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
            </div>
          </section>

          <section style={styles.gridCard}>
            <h3 style={styles.cardHeader}><Code size={18} color="#f97316" /> Development & Tech Stack</h3>
            <div style={styles.inputStack}>
              <div style={styles.field}>
                <label style={styles.label}>Core Competencies</label>
                <div style={styles.inputIconWrapper}>
                  <Briefcase size={16} style={styles.innerIcon} />
                  <input
                    value={tempProfile.skills}
                    disabled={!isEditing}
                    onChange={(event) => handleChange('skills', event.target.value)}
                    style={{ ...(isEditing ? styles.inputFocus : styles.inputBase), paddingLeft: '40px' }}
                  />
                </div>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Organizations</label>
                <input
                  value={tempProfile.organizations}
                  disabled={!isEditing}
                  onChange={(event) => handleChange('organizations', event.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase}
                />
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    padding: '2rem',
    background: '#fff',
    minHeight: '100vh',
    borderRadius: '16px',
    fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif',
  },
  header: {
    paddingBottom: '3rem',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '3rem',
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2rem',
  },
  profileMeta: { display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' },
  avatarFrame: { position: 'relative', borderRadius: '32px', padding: '4px' },
  avatarMain: {
    width: '100px',
    height: '100px',
    borderRadius: '28px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#f8fafc',
    position: 'relative',
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fff7ed',
    color: '#ea580c',
    fontSize: '32px',
    fontWeight: 800,
  },
  avatarHover: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  imageDeleteBtn: {
    position: 'absolute',
    top: '-8px',
    right: '-8px',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleInfo: { display: 'flex', flexDirection: 'column', gap: '10px' },
  nameDisplay: { fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
  badgeRow: { display: 'flex', gap: '12px', flexWrap: 'wrap' },
  pillBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    background: '#f8fafc',
    padding: '6px 14px',
    borderRadius: '100px',
    fontWeight: 600,
    color: '#475569',
    border: '1px solid #e2e8f0',
  },
  actionSlot: { display: 'flex', alignItems: 'center' },
  editTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#fb923c',
    border: '1px solid #e2e8f0',
    padding: '12px 20px',
    borderRadius: '14px',
    fontWeight: 700,
    color: '#fff7ed',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  buttonSet: { display: 'flex', gap: '12px' },
  primaryBtn: { background: '#fb923c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' },
  ghostBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' },
  formContainer: { width: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem' },
  gridCard: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  cardHeader: { fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#64748b' },
  inputBase: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: '15px' },
  inputFocus: { padding: '14px', borderRadius: '12px', border: '2px solid #fb923c', background: '#fff', outline: 'none', fontSize: '15px' },
  inputLocked: { padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' },
  inputIconWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  innerIcon: { position: 'absolute', left: '14px', color: '#94a3b8' },
};