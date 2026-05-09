import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Document, Signer } from '../models';
import { toast, showLoading, hideLoading } from '../../shared/utils/toast';
import { computeSHA256 } from '../../shared/utils/crypto';
import { SignatureZone } from './upload-state.service';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);

  async getDocuments(): Promise<Document[]> {
    const user = this.auth.currentUser();
    if (!user) return [];

    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.documents)
        .select('*')
        .eq('owner_id', user.user_id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as Document[];
    } catch (e) {
      console.error('Error loading documents:', e);
      return [];
    }
  }

  async getDocumentById(docId: string): Promise<Document | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.documents)
        .select('*')
        .eq('id', docId)
        .single();

      if (error) return null;
      return data as Document;
    } catch {
      return null;
    }
  }

  async getDocumentByCode(code: string): Promise<Document | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.documents)
        .select('*')
        .eq('code', code)
        .single();

      if (error) return null;
      return data as Document;
    } catch {
      return null;
    }
  }

  async getSignerByCode(code: string): Promise<Signer | null> {
    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.signers)
        .select('*')
        .eq('code', code)
        .single();

      if (error) return null;
      return data as Signer;
    } catch {
      return null;
    }
  }

  async getSignersByDocId(docId: string): Promise<Signer[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.supabase.tables.signers)
        .select('*')
        .eq('doc_id', docId)
        .order('zone_index', { ascending: true });

      if (error) return [];
      return data as Signer[];
    } catch {
      return [];
    }
  }

  async createDocumentWithSigners(
    file: File,
    fileBytes: ArrayBuffer,
    zones: SignatureZone[],
  ): Promise<{ doc: Document; signers: Signer[] }> {
    const user = this.auth.currentUser();
    if (!user) throw new Error('No autenticado');
    if (zones.length === 0) throw new Error('Debes definir al menos una zona de firma');

    showLoading('Subiendo documento...');
    try {
      // Upload file to Supabase storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploaded, error: uploadError } = await this.supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Compute SHA-256 hash for document integrity
      const hash = await computeSHA256(fileBytes);

      const code = this.generateCode();
      const primaryZone = zones[0];

      // Create document
      const { data: doc, error: docError } = await this.supabase
        .from(this.supabase.tables.documents)
        .insert({
          file_name: file.name,
          file_size: file.size,
          file_type: file.type,
          file_id: uploaded.path,
          code: code,
          owner_id: user.user_id,
          status: 'pending',
          sign_zone_x: primaryZone.x,
          sign_zone_y: primaryZone.y,
          sign_zone_w: primaryZone.w,
          sign_zone_h: primaryZone.h,
          sign_zone_page: primaryZone.page,
          sign_zone_scale: 1.5,
          signature_data: null,
          signed_file_id: null,
          signed_at: null
        })
        .select()
        .single();

      if (docError) throw docError;

      // Create signers for each zone
      const createdSigners: Signer[] = [];
      for (let i = 0; i < zones.length; i++) {
        const zone = zones[i];
        const signerCode = this.generateCode();

        const { data: signer, error: signerError } = await this.supabase
          .from(this.supabase.tables.signers)
          .insert({
            doc_id: doc.id,
            signer_name: zone.signerName || `Firmante ${i + 1}`,
            signer_email: zone.signerEmail || '',
            zone_index: i,
            code: signerCode,
            status: 'pending',
            signed_file_id: null,
            signed_at: null
          })
          .select()
          .single();

        if (signerError) throw signerError;
        createdSigners.push(signer as Signer);
      }

      // Update usage
      const currentDocs = user.docs_used || 0;
      await this.supabase
        .from(this.supabase.tables.users)
        .update({ docs_used: currentDocs + 1 })
        .eq('id', user.id);

      // Log audit event
      await this.logAuditEvent(doc.id, 'document_created', `Documento creado con ${zones.length} firmante(s). Hash: ${hash}`);

      hideLoading();
      toast('Documento creado exitosamente', 'success');
      return { doc: doc as Document, signers: createdSigners };
    } catch (e: any) {
      hideLoading();
      toast('Error: ' + e.message, 'error');
      throw e;
    }
  }

  async updateSignerSignature(
    signerCode: string,
    signedFileId: string,
    signatureData?: string
  ): Promise<void> {
    try {
      await this.supabase
        .from(this.supabase.tables.signers)
        .update({
          status: 'signed',
          signed_file_id: signedFileId,
          signed_at: new Date().toISOString()
        })
        .eq('code', signerCode);
    } catch (e) {
      console.error('Error updating signer:', e);
      throw e;
    }
  }

  async updateDocumentStatus(docId: string, status: 'pending' | 'partial' | 'signed', signedFileId?: string) {
    const updateData: any = { status };
    if (signedFileId) updateData.signed_file_id = signedFileId;
    if (status === 'signed') updateData.signed_at = new Date().toISOString();

    const { error } = await this.supabase
      .from(this.supabase.tables.documents)
      .update(updateData)
      .eq('id', docId);

    if (error) throw error;
  }

  async logAuditEvent(docId: string, event: string, details: string) {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();

      await this.supabase
        .from(this.supabase.tables.audit_logs)
        .insert({
          doc_id: docId,
          event,
          details,
          user_id: user?.id || 'anonymous'
        });
    } catch (e) {
      console.error('Error logging audit event:', e);
    }
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
}
