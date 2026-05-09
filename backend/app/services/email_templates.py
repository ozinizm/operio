from typing import Dict, Optional

def get_base_html(content: str) -> str:
    return f"""
    <html>
    <body style="font-family: sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #000;">Operio</h1>
            </div>
            {content}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #777; text-align: center;">
                Bu e-posta Operio sistemi tarafından otomatik olarak gönderilmiştir.
            </p>
        </div>
    </body>
    </html>
    """

def welcome_workspace_admin(full_name: str, email: str, temporary_password: Optional[str] = None) -> Dict[str, str]:
    password_info = ""
    if temporary_password:
        password_info = f"""
        <p>Giriş e-posta adresiniz: <strong>{email}</strong></p>
        <p>Geçici şifreniz: <strong style="background: #f4f4f4; padding: 2px 5px; border-radius: 3px;">{temporary_password}</strong></p>
        <p style="color: #d32f2f;">Güvenliğiniz için ilk girişinizde şifrenizi değiştirmeniz gerekmektedir.</p>
        """
    else:
        password_info = f"<p>Giriş e-posta adresiniz: <strong>{email}</strong></p>"

    html = f"""
    <h2>Hoş Geldiniz, {full_name}!</h2>
    <p>Operio platformuna işletme yöneticisi olarak başarıyla eklendiniz.</p>
    {password_info}
    <p>Aşağıdaki butona tıklayarak sisteme giriş yapabilirsiniz:</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://operio.fikircreative.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Panele Giriş Yap</a>
    </div>
    """
    
    text = f"Hoş Geldiniz {full_name}!\n\nOperio platformuna başarıyla eklendiniz.\nE-posta: {email}\n"
    if temporary_password:
        text += f"Geçici Şifre: {temporary_password}\nLütfen ilk girişte şifrenizi değiştirin.\n"
    text += "\nLink: https://operio.fikircreative.com"

    return {
        "subject": "Operio'ya Hoş Geldiniz",
        "html": get_base_html(html),
        "text": text
    }

def password_reset_by_admin(full_name: str, temporary_password: str) -> Dict[str, str]:
    html = f"""
    <h2>Şifreniz Sıfırlandı</h2>
    <p>Merhaba {full_name},</p>
    <p>Hesap şifreniz bir yönetici tarafından sıfırlanmıştır.</p>
    <p>Yeni geçici şifreniz: <strong style="background: #f4f4f4; padding: 2px 5px; border-radius: 3px;">{temporary_password}</strong></p>
    <p style="color: #d32f2f;">Lütfen sisteme giriş yaptıktan sonra şifrenizi güncellemeyi unutmayın.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://operio.fikircreative.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Sisteme Giriş Yap</a>
    </div>
    """
    
    text = f"Merhaba {full_name},\n\nŞifreniz sıfırlandı.\nYeni Geçici Şifre: {temporary_password}\nLink: https://operio.fikircreative.com"

    return {
        "subject": "Şifreniz Sıfırlandı",
        "html": get_base_html(html),
        "text": text
    }

def forgot_password_request_admin_notice(email: str, date_str: str) -> Dict[str, str]:
    html = f"""
    <h2>Yeni Şifre Yardım Talebi</h2>
    <p>Sistemde yeni bir şifre sıfırlama yardım talebi oluşturuldu.</p>
    <ul>
        <li><strong>E-posta:</strong> {email}</li>
        <li><strong>Tarih:</strong> {date_str}</li>
    </ul>
    <p>Talebi incelemek ve yanıtlamak için platform yönetim paneline gidebilirsiniz.</p>
    <div style="text-align: center; margin: 30px 0;">
        <a href="https://operio.fikircreative.com/platform/settings" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Talepleri Yönet</a>
    </div>
    """
    
    text = f"Yeni Şifre Yardım Talebi\n\nE-posta: {email}\nTarih: {date_str}\nLütfen platform yönetim panelinden kontrol edin."

    return {
        "subject": "Yeni Şifre Yardım Talebi",
        "html": get_base_html(html),
        "text": text
    }

def support_request_received_user_notice() -> Dict[str, str]:
    html = """
    <h2>Talebiniz Alındı</h2>
    <p>Şifre sıfırlama yardım talebiniz başarıyla alınmıştır.</p>
    <p>Hesabınız doğrulandıktan sonra işletme yöneticiniz veya Operio destek ekibi sizinle iletişime geçecektir.</p>
    <p>Eğer bu talebi siz oluşturmadıysanız, lütfen bu e-postayı dikkate almayın.</p>
    """
    
    text = "Şifre sıfırlama yardım talebiniz alınmıştır. En kısa sürede sizinle iletişime geçilecektir."

    return {
        "subject": "Şifre Yardım Talebiniz Alındı",
        "html": get_base_html(html),
        "text": text
    }
