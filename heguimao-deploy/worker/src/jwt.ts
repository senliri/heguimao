/**
 * Simplified JWT Implementation for Cloudflare Workers
 */

class JWT {
  static async sign(payload, secret, options = {}) {
    const { expiresIn = '30d', issuer = 'heguimao' } = options;
    
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const expSeconds = this.parseExpiration(expiresIn);
    
    const jwtPayload = {
      iat: now,
      exp: now + expSeconds,
      iss: issuer,
      ...payload
    };
    
    const signingInput = `${this.b64encode(JSON.stringify(header))}.${this.b64encode(JSON.stringify(jwtPayload))}`;
    const signature = await this.signSHA256(signingInput, secret);
    
    return `${signingInput}.${signature}`;
  }
  
  static async verify(token, secret) {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid token format');
      }
      
      const [headerEncoded, payloadEncoded, signature] = parts;
      const signingInput = `${headerEncoded}.${payloadEncoded}`;
      
      // Verify signature
      const validSignature = await this.verifySHA256(signingInput, signature, secret);
      if (!validSignature) {
        throw new Error('Invalid signature');
      }
      
      // Decode payload
      const payload = JSON.parse(this.b64decode(payloadEncoded));
      
      // Check expiration
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
      }
      
      return payload;
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }
  
  static async signSHA256(message, secret) {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
    return this.b64encode(String.fromCharCode(...new Uint8Array(signature)));
  }
  
  static async verifySHA256(message, expectedSignature, secret) {
    const actualSignature = await this.signSHA256(message, secret);
    return actualSignature === expectedSignature;
  }
  
  static b64encode(str) {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  static b64decode(str) {
    // Add padding
    let padded = str;
    const padding = 4 - (padded.length % 4);
    if (padding !== 4) {
      padded += '='.repeat(padding);
    }
    
    // Convert base64url to base64
    const base64 = padded
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    return atob(base64);
  }
  
  static parseExpiration(expiration) {
    if (typeof expiration === 'number') {
      return expiration;
    }
    
    const match = expiration.match(/(\d+)([smhd])/);
    if (!match) {
      throw new Error('Invalid expiration format');
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: throw new Error('Invalid expiration unit');
    }
  }
}

export { JWT };
