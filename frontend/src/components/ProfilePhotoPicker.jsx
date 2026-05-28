import { useRef, useState } from 'react'
import UserAvatar from './UserAvatar'
import { uploadProfilePhoto, removeProfilePhoto } from '../services/profileApi'

export default function ProfilePhotoPicker({
  nom,
  prenom,
  avatarUrl,
  size = 48,
  editable = true,
  compact = false,
  hideBadge = false,
  navInline = false,
  onUpdated
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const pickFile = () => {
    if (!editable || uploading) return
    inputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Choisissez une image (JPG, PNG, etc.)')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image trop lourde (max 5 Mo)')
      return
    }

    setUploading(true)
    try {
      const data = await uploadProfilePhoto(file)
      onUpdated?.(data)
    } catch (err) {
      alert(err.message || err.userMessage || 'Impossible d’envoyer la photo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async (e) => {
    e.stopPropagation()
    if (!window.confirm('Supprimer votre photo de profil ?')) return
    setUploading(true)
    try {
      const data = await removeProfilePhoto()
      onUpdated?.(data)
    } catch (err) {
      alert(err.userMessage || 'Erreur lors de la suppression')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      className={`mh-profile-picker ${editable ? 'mh-profile-picker--editable' : ''} ${navInline ? 'mh-profile-picker--nav-inline' : ''}`}
    >
      <div className="mh-profile-picker-wrap" onClick={pickFile}>
        <UserAvatar
          nom={nom}
          prenom={prenom}
          avatarUrl={avatarUrl}
          size={size}
          onClick={editable ? pickFile : undefined}
        />
        {editable && !hideBadge && (
          <span className="mh-profile-picker-badge" title="Changer la photo">
            {uploading ? '⏳' : '📷'}
          </span>
        )}
      </div>
      {editable && (
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          style={{ display: 'none' }}
          onChange={handleFile}
        />
      )}
      {editable && !compact && (
        <div className="mh-profile-picker-actions">
          <button
            type="button"
            className="mh-profile-picker-btn"
            onClick={pickFile}
            disabled={uploading}
          >
            {uploading ? 'Envoi…' : avatarUrl ? 'Changer la photo' : 'Ajouter une photo'}
          </button>
          {avatarUrl && (
            <button
              type="button"
              className="mh-profile-picker-btn mh-profile-picker-btn--muted"
              onClick={handleRemove}
              disabled={uploading}
            >
              Supprimer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
