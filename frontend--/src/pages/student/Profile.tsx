import React, { useState, useRef } from 'react';
import { Edit, Camera, X, GraduationCap, Mail, User, Globe, Code, Briefcase } from 'lucide-react';

export const StudentProfile: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    name: 'Lyra Jamaica M. Vergara',
    email: 'lyra@example.com',
    idNumber: '202210001',
    program: 'BSIT',
    year: '4th Year',
    phone: '+63 9XX XXX XXXX',
    address: 'Cabuyao, Laguna',
    skills: 'React, Vue, Frontend Development',
    image: ''
  });

  const [tempProfile, setTempProfile] = useState(profile);

  const handleChange = (field: string, value: string) => {
    setTempProfile({ ...tempProfile, [field]: value });
  };

  const handleSave = () => {
    setProfile(tempProfile);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempProfile(profile);
    setIsEditing(false);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setTempProfile((prev) => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageFile(file);
  };

  const handleRemoveImage = () => {
    setTempProfile((prev) => ({ ...prev, image: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const initials = profile.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={styles.container}>
      {/* Dynamic Header Section */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.profileMeta}>
            <div 
              style={{
                ...styles.avatarFrame,
                border: isEditing ? (isDragging ? '3px solid #fb923c' : '3px dashed #cbd5e1') : 'none'
              }}
              onDragOver={isEditing ? (e) => { e.preventDefault(); setIsDragging(true); } : undefined}
              onDragLeave={isEditing ? () => setIsDragging(false) : undefined}
              onDrop={isEditing ? handleDrop : undefined}
            >
              <div 
                style={styles.avatarMain}
                onClick={isEditing ? () => fileInputRef.current?.click() : undefined}
              >
                {tempProfile.image ? (
                  <img src={tempProfile.image} alt="Profile" style={styles.avatarImg} />
                ) : (
                  <div style={styles.avatarPlaceholder}>{initials}</div>
                )}
                {isEditing && (
                  <div style={styles.avatarHover}>
                    <Camera size={20} color="#fff" />
                  </div>
                )}
              </div>
              {isEditing && tempProfile.image && (
                <button onClick={handleRemoveImage} style={styles.imageDeleteBtn}><X size={10} /></button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
            </div>

            <div style={styles.titleInfo}>
              <h1 style={styles.nameDisplay}>{profile.name}</h1>
              <div style={styles.badgeRow}>
                <span style={styles.pillBadge}><GraduationCap size={14} /> {profile.program}</span>
                <span style={styles.pillBadge}><Globe size={14} /> {profile.address}</span>
              </div>
            </div>
          </div>

          <div style={styles.actionSlot}>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} style={styles.editTrigger}>
                <Edit size={16} /> Edit Details
              </button>
            ) : (
              <div style={styles.buttonSet}>
                <button onClick={handleCancel} style={styles.ghostBtn}>Cancel</button>
                <button onClick={handleSave} style={styles.primaryBtn}>Save Profile</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
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
                  onChange={(e) => handleChange('name', e.target.value)}
                  style={isEditing ? styles.inputFocus : styles.inputBase} 
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Student ID</label>
                <input value={tempProfile.idNumber} disabled style={styles.inputLocked} />
              </div>
            </div>
          </section>

          <section style={styles.gridCard}>
            <h3 style={styles.cardHeader}><Mail size={18} color="#f97316" /> Communication</h3>
            <div style={styles.inputStack}>
              <div style={styles.field}>
                <label style={styles.label}>Institutional Email</label>
                <input value={tempProfile.email} disabled={!isEditing} onChange={(e) => handleChange('email', e.target.value)} style={isEditing ? styles.inputFocus : styles.inputBase} />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Mobile Number</label>
                <input value={tempProfile.phone} disabled={!isEditing} onChange={(e) => handleChange('phone', e.target.value)} style={isEditing ? styles.inputFocus : styles.inputBase} />
              </div>
            </div>
          </section>

          <section style={{ ...styles.gridCard, gridColumn: '1 / -1' }}>
            <h3 style={styles.cardHeader}><Code size={18} color="#f97316" /> Development & Tech Stack</h3>
            <div style={styles.field}>
              <label style={styles.label}>Core Competencies</label>
              <div style={styles.inputIconWrapper}>
                <Briefcase size={16} style={styles.innerIcon} />
                <input 
                  value={tempProfile.skills} 
                  disabled={!isEditing} 
                  onChange={(e) => handleChange('skills', e.target.value)} 
                  style={{...(isEditing ? styles.inputFocus : styles.inputBase), paddingLeft: '40px'}} 
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
    fontFamily: '"Plus Jakarta Sans", -apple-system, sans-serif'
  },
  header: {
    paddingBottom: '3rem',
    borderBottom: '1px solid #f1f5f9',
    marginBottom: '3rem'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '2rem'
  },
  profileMeta: { display: 'flex', alignItems: 'center', gap: '2rem' },
  avatarFrame: { position: 'relative', borderRadius: '32px', padding: '4px' },
  avatarMain: {
    width: '100px',
    height: '100px',
    borderRadius: '28px',
    overflow: 'hidden',
    cursor: 'pointer',
    background: '#f8fafc',
    position: 'relative'
  },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  avatarPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff7ed', color: '#ea580c', fontSize: '32px', fontWeight: 800 },
  avatarHover: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 1 },
  imageDeleteBtn: { position: 'absolute', top: '-8px', right: '-8px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: '24px', height: '24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  titleInfo: { display: 'flex', flexDirection: 'column', gap: '10px' },
  nameDisplay: { fontSize: '36px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' },
  badgeRow: { display: 'flex', gap: '12px' },
  pillBadge: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', background: '#f8fafc', padding: '6px 14px', borderRadius: '100px', fontWeight: 600, color: '#475569', border: '1px solid #e2e8f0' },
  actionSlot: { display: 'flex', alignItems: 'center' },
  editTrigger: { display: 'flex', alignItems: 'center', gap: '8px', background: '#fb923c', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '14px', fontWeight: 700, color: '#fff7ed', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
  buttonSet: { display: 'flex', gap: '12px' },
  primaryBtn: { background: '#fb923c', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' },
  ghostBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 24px', borderRadius: '14px', fontWeight: 700, cursor: 'pointer' },
  formContainer: { width: '100%' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' },
  gridCard: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  cardHeader: { fontSize: '18px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 },
  inputStack: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: 700, color: '#64748b' },
  inputBase: { padding: '14px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#1e293b', fontSize: '15px' },
  inputFocus: { padding: '14px', borderRadius: '12px', border: '2px solid #fb923c', background: '#fff', outline: 'none', fontSize: '15px' },
  inputLocked: { padding: '14px', borderRadius: '12px', border: '1px solid #f1f5f9', background: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' },
  inputIconWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
  innerIcon: { position: 'absolute', left: '14px', color: '#94a3b8' }
};