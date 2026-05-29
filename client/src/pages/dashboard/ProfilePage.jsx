import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useDispatch, useSelector } from "react-redux";
import { getMyProfile, updateMyProfile, updateProfileImage } from "../../store/authSlice";
import authApi from "../../api/authApi";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";
import { HiUser, HiCamera } from "react-icons/hi";

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const dispatch = useDispatch();
  const { loading: isProfileLoading, user: stateUser } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  const user = stateUser || authUser;

  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const [form, setForm] = useState({ name: "", phone: "", address: { street: "", city: "", state: "", zipCode: "" } });
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        phone: user.phone || "",
        address: {
          street: user.address?.street || "",
          city: user.address?.city || "",
          state: user.address?.state || "",
          zipCode: user.address?.zipCode || "",
        }
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await dispatch(updateMyProfile(form)).unwrap();
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size should not exceed 2MB");
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);

    try {
      setUploading(true);
      await dispatch(updateProfileImage(formData)).unwrap();
      toast.success("Profile image updated");
    } catch (err) {
      toast.error(err || "Failed to update image");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setChangingPwd(true);
      await authApi.changePassword(pwdForm);
      toast.success("Password changed successfully");
      setPwdForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  if (isProfileLoading && !user) return <div className="p-8">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      <h1 className="text-2xl font-bold text-surface-900 mb-6">Account Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-surface-100 overflow-hidden">
        <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start">
          
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-surface-100 flex items-center justify-center border-4 border-white shadow-lg">
                {user?.profileImage?.secure_url ? (
                  <img src={user.profileImage.secure_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <HiUser className="w-16 h-16 text-surface-400" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 shadow-md transition-colors">
                <HiCamera className="w-4 h-4" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
            <div className="text-center">
              <h3 className="font-bold text-surface-900">{user?.name}</h3>
              <p className="text-sm text-surface-500 capitalize">{user?.role}</p>
            </div>
          </div>

          <div className="flex-1 w-full">
            <h3 className="text-lg font-semibold border-b border-surface-100 pb-2 mb-4">Personal Information</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                <Input label="Email" value={user?.email} disabled tooltip="Email cannot be changed" />
                <Input label="Phone Number" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                {user?.bloodGroup && <Input label="Blood Group" value={user?.bloodGroup} disabled />}
              </div>

              <h4 className="font-medium text-surface-700 pt-4">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Street" placeholder="123 Main St" value={form.address.street} onChange={e => setForm({...form, address: {...form.address, street: e.target.value}})} />
                <Input label="City" placeholder="City" value={form.address.city} onChange={e => setForm({...form, address: {...form.address, city: e.target.value}})} />
                <Input label="State" placeholder="State" value={form.address.state} onChange={e => setForm({...form, address: {...form.address, state: e.target.value}})} />
                <Input label="Zip Code" placeholder="ZIP" value={form.address.zipCode} onChange={e => setForm({...form, address: {...form.address, zipCode: e.target.value}})} />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={updating}>Save Changes</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {!user?.isOAuthUser && (
        <div className="bg-white rounded-xl shadow-sm border border-surface-100 p-6 md:p-8">
          <h3 className="text-lg font-semibold border-b border-surface-100 pb-2 mb-4">Change Password</h3>
          <form onSubmit={handleChangePassword} className="max-w-md space-y-4">
            <Input label="Current Password" type="password" value={pwdForm.oldPassword} onChange={e => setPwdForm({...pwdForm, oldPassword: e.target.value})} required />
            <Input label="New Password" type="password" value={pwdForm.newPassword} onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} required />
            <div className="pt-2">
              <Button type="submit" variant="secondary" isLoading={changingPwd}>Update Password</Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
