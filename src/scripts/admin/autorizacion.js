/**
 * Autorización administrativa compartida por /admin y /asistencia.
 *
 * Iniciar sesión no basta para ser administrador. Firebase Auth permite crear
 * usuarios desde su API cuando el proveedor Correo/Contraseña está habilitado,
 * aunque el sitio no muestre un formulario de registro. La autorización real
 * vive por UID en `admins/{uid}` con `{ activo: true }`, o en el custom claim
 * `admin: true` si el proyecto lo configura en el futuro.
 */

/**
 * @param {import('firebase/firestore')} dbMod
 * @param {import('firebase/firestore').Firestore} db
 * @param {import('firebase/auth').User} usuario
 */
export async function obtenerAutorizacionAdmin(dbMod, db, usuario) {
  const token = await usuario.getIdTokenResult();
  if (token.claims.admin === true) {
    return { autorizado: true, origen: 'claim', perfil: null };
  }

  const ref = dbMod.doc(db, 'admins', usuario.uid);
  const snap = await dbMod.getDoc(ref);
  const perfil = snap.exists() ? snap.data() : null;

  return {
    autorizado: perfil?.activo === true,
    origen: perfil?.activo === true ? 'firestore' : null,
    perfil,
  };
}
