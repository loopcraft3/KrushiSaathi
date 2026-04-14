import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Pencil, X, Check, Plus, Loader2, MapPin, Phone, Mail, CreditCard, Leaf } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const FARMER_TYPES = [
  { value: 'wheat',        label: 'Wheat',        icon: '🌾' },
  { value: 'kharif',       label: 'Kharif',       icon: '🌽' },
  { value: 'rabi',         label: 'Rabi',         icon: '🌿' },
  { value: 'horticulture', label: 'Horticulture', icon: '🍎' },
  { value: 'mixed',        label: 'Mixed',        icon: '🌱' },
  { value: 'dairy',        label: 'Dairy',        icon: '🐄' },
  { value: 'organic',      label: 'Organic',      icon: '♻️' },
]

const FARMER_TYPE_META: Record<string, { label: string; icon: string }> = {
  wheat:        { label: 'Wheat Farmer',     icon: '🌾' },
  kharif:       { label: 'Kharif Farmer',    icon: '🌽' },
  rabi:         { label: 'Rabi Farmer',      icon: '🌿' },
  horticulture: { label: 'Horticulture',     icon: '🍎' },
  mixed:        { label: 'Mixed Farming',    icon: '🌱' },
  dairy:        { label: 'Dairy Farmer',     icon: '🐄' },
  organic:      { label: 'Organic Farmer',   icon: '♻️' },
  vendor:       { label: 'Equipment Vendor', icon: '🏪' },
}

// ── AVATAR COMPONENT ─────────────────────────────────────────────────
function ProfileAvatar({ name, role, size = 'lg' }: { name?: string; role?: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const sizeClass = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-16 h-16 text-xl',
    lg: 'w-24 h-24 text-3xl',
  }[size]

  const roleEmoji = role === 'vendor' ? '🏪' : '👨‍🌾'
  const badgeSizeClass = size === 'lg' ? 'w-8 h-8 text-base' : 'w-5 h-5 text-xs'

  return (
    <div className="relative inline-flex flex-shrink-0">
      {/* Main circle with gradient + ring */}
      <div
        className={`${sizeClass} rounded-2xl flex items-center justify-center font-bold text-white shadow-lg ring-4 ring-white`}
        style={{
          background: 'linear-gradient(135deg, #14532d 0%, #16a34a 50%, #22c55e 100%)',
          letterSpacing: '-0.02em',
        }}
      >
        {initials}
      </div>

      {/* Role badge */}
      <div
        className={`absolute -bottom-1.5 -right-1.5 ${badgeSizeClass} rounded-xl flex items-center justify-center bg-white shadow-md border-2 border-green-100`}
      >
        {roleEmoji}
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, updateProfile } = useAuth()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name:        user?.name         || '',
    phone:       user?.phone        || '',
    village:     user?.village      || '',
    place:       user?.place        || '',
    aadhaar:     user?.aadhaar      || '',
    land_area:   user?.land_area?.toString() || '',
    farmer_type: user?.farmer_type  || '',
    bio:         user?.bio          || '',
    role:        user?.role         || 'farmer',
  })
  const [crops, setCrops] = useState<string[]>(user?.crops_grown || [])
  const [cropInput, setCropInput] = useState('')

  const startEdit = () => {
    setForm({
      name:        user?.name         || '',
      phone:       user?.phone        || '',
      village:     user?.village      || '',
      place:       user?.place        || '',
      aadhaar:     user?.aadhaar      || '',
      land_area:   user?.land_area?.toString() || '',
      farmer_type: user?.farmer_type  || '',
      bio:         user?.bio          || '',
      role:        user?.role         || 'farmer',
    })
    setCrops(user?.crops_grown || [])
    setEditing(true)
    setError('')
    setSaveSuccess(false)
  }

  const cancelEdit = () => { setEditing(false); setError('') }

  const addCrop = () => {
    const c = cropInput.trim()
    if (c && !crops.includes(c)) setCrops(p => [...p, c])
    setCropInput('')
  }

  const removeCrop = (c: string) => setCrops(p => p.filter(x => x !== c))

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await updateProfile({
        name:        form.name,
        phone:       form.phone || undefined,
        village:     form.village || undefined,
        place:       form.place || undefined,
        aadhaar:     form.aadhaar || undefined,
        land_area:   form.land_area ? parseFloat(form.land_area) : undefined,
        farmer_type: form.farmer_type || undefined,
        bio:         form.bio || undefined,
        crops_grown: crops,
        role:        form.role as 'farmer' | 'vendor',
      })
      setSaveSuccess(true)
      setEditing(false)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (e: any) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const ftMeta = user?.farmer_type
    ? FARMER_TYPE_META[user.farmer_type]
    : user?.role === 'vendor' ? FARMER_TYPE_META['vendor'] : null

  const locationLine = [user?.village, user?.place].filter(Boolean).join(', ')

  const inp = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50 focus:bg-white transition'
  const lbl = 'block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide'

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ── Green tint header ─────────────────────────────────────── */}
        <PageHeader
          icon={<Leaf className="h-7 w-7 text-white" />}
          title="My Profile"
          subtitle="Manage your personal and farming information"
        >
          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-green-700 text-sm font-semibold flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-green-200">
                <Check size={14} /> Saved!
              </span>
            )}
            {!editing ? (
              <button onClick={startEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)' }}>
                <Pencil size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button onClick={cancelEdit}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-sm">
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm text-white shadow-md transition-all hover:shadow-lg disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #14532d, #16a34a)' }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>
        </PageHeader>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-center gap-2">
            ⚠️ {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left card: avatar + summary ──────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col items-center text-center space-y-4">

            {/* ── IMPROVED AVATAR ──────────────────────────────────── */}
            <ProfileAvatar name={user?.name} role={user?.role} size="lg" />

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-800">{user?.name}</h2>
              {ftMeta && (
                <p className="text-gray-500 text-sm">{ftMeta.icon} {ftMeta.label}</p>
              )}
              {/* Role pill */}
              <span className={`inline-block text-xs px-3 py-1 rounded-full font-semibold mt-1 ${
                user?.role === 'vendor'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-green-100 text-green-700'
              }`}>
                {user?.role === 'vendor' ? '🏪 Vendor' : '👨‍🌾 Farmer'}
              </span>
            </div>

            {/* Quick stats */}
            <div className="w-full grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{user?.land_area ?? '—'}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Acres</div>
              </div>
              <div className="text-center border-x border-gray-100">
                <div className="text-xl font-bold text-green-600">{user?.crops_grown?.length ?? 0}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Crops</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600 capitalize">{user?.role}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wide">Role</div>
              </div>
            </div>

            {/* Contact info */}
            <div className="w-full space-y-2 text-sm text-left pt-3 border-t border-gray-100">
              {locationLine && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} className="text-green-500 flex-shrink-0" />
                  <span className="truncate">{locationLine}</span>
                </div>
              )}
              {user?.email && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail size={14} className="text-green-500 flex-shrink-0" />
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              )}
              {user?.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-green-500 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user?.aadhaar && (
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs">{user.aadhaar}</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Right card: details / edit ────────────────────────────── */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">

            <div>
              <h3 className="text-lg font-bold text-gray-800">Profile Details</h3>
              <p className="text-gray-500 text-sm">Your personal and farming information</p>
            </div>

            {!editing ? (
              /* ── VIEW MODE ──────────────────────────────────────────── */
              <div className="space-y-5">

                {/* Bio */}
                <div>
                  <div className={lbl}>Bio</div>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {user?.bio || <span className="text-gray-400 italic">No bio yet — click Edit Profile to add one.</span>}
                  </p>
                </div>

                <div className="border-t border-gray-100" />

                {/* Crops */}
                <div>
                  <div className={lbl}>Crops Grown</div>
                  {user?.crops_grown && user.crops_grown.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {user.crops_grown.map(c => (
                        <span key={c} className="px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-sm italic">No crops added yet.</p>
                  )}
                </div>

                <div className="border-t border-gray-100" />

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {[
                    { label: 'Full Name',       value: user?.name },
                    { label: 'Role',             value: user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '—' },
                    { label: 'Phone',            value: user?.phone || '—' },
                    { label: 'Email',            value: user?.email },
                    { label: 'Village',          value: user?.village || '—' },
                    { label: 'District / City',  value: user?.place || '—' },
                    { label: 'Land Area',        value: user?.land_area ? `${user.land_area} acres` : '—' },
                    { label: 'Farming Type',     value: ftMeta ? `${ftMeta.icon} ${ftMeta.label}` : '—' },
                    { label: 'Aadhaar / ID',     value: user?.aadhaar || '—' },
                  ].map(({ label, value }) => (
                    <div key={label} className="group">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                      <div className="text-sm text-gray-700 font-medium">{value}</div>
                    </div>
                  ))}
                </div>
              </div>

            ) : (
              /* ── EDIT MODE ──────────────────────────────────────────── */
              <div className="space-y-4">

                {/* Role switcher */}
                <div>
                  <label className={lbl}>I am a</label>
                  <div className="flex gap-3">
                    {(['farmer', 'vendor'] as const).map(r => (
                      <button key={r} type="button"
                        onClick={() => setForm(f => ({ ...f, role: r }))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                          form.role === r
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 text-gray-400 hover:border-gray-300'
                        }`}>
                        {r === 'farmer' ? '👨‍🌾 Farmer' : '🏪 Vendor'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name + Phone */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Full Name *</label>
                    <input required value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inp} placeholder="Ramesh Patil" />
                  </div>
                  <div>
                    <label className={lbl}>Phone</label>
                    <input value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={inp} placeholder="9876543210" />
                  </div>
                </div>

                {/* Village + Place */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Village</label>
                    <input value={form.village}
                      onChange={e => setForm(f => ({ ...f, village: e.target.value }))}
                      className={inp} placeholder="Karad" />
                  </div>
                  <div>
                    <label className={lbl}>District / City</label>
                    <input value={form.place}
                      onChange={e => setForm(f => ({ ...f, place: e.target.value }))}
                      className={inp} placeholder="Satara" />
                  </div>
                </div>

                {/* Land area + Farmer type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Land Area (acres)</label>
                    <input type="number" min="0" step="0.5" value={form.land_area}
                      onChange={e => setForm(f => ({ ...f, land_area: e.target.value }))}
                      className={inp} placeholder="e.g. 5" />
                  </div>
                  <div>
                    <label className={lbl}>Farming Type</label>
                    <select value={form.farmer_type}
                      onChange={e => setForm(f => ({ ...f, farmer_type: e.target.value }))}
                      className={inp + ' cursor-pointer'}>
                      <option value="">Select type</option>
                      {FARMER_TYPES.map(ft => (
                        <option key={ft.value} value={ft.value}>{ft.icon} {ft.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Aadhaar */}
                <div>
                  <label className={lbl}>Aadhaar / Farmer ID</label>
                  <input value={form.aadhaar}
                    onChange={e => setForm(f => ({ ...f, aadhaar: e.target.value }))}
                    className={inp} placeholder="XXXX-XXXX-XXXX" />
                </div>

                {/* Bio */}
                <div>
                  <label className={lbl}>Bio</label>
                  <textarea value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    rows={3} className={inp + ' resize-none'}
                    placeholder="Tell us about your farming experience…" />
                </div>

                {/* Crops grown */}
                <div>
                  <label className={lbl}>Crops Grown</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {crops.map(c => (
                      <span key={c} className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 border border-amber-200">
                        {c}
                        <button type="button" onClick={() => removeCrop(c)}
                          className="ml-0.5 text-amber-500 hover:text-amber-700 transition-colors">
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={cropInput}
                      onChange={e => setCropInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCrop() } }}
                      className={inp + ' flex-1'}
                      placeholder="Type a crop and press Enter or +" />
                    <button type="button" onClick={addCrop}
                      className="px-3 py-2.5 rounded-xl bg-green-100 text-green-700 hover:bg-green-200 transition font-bold text-sm flex items-center gap-1">
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">e.g. Wheat, Rice, Cotton, Bajra</p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}