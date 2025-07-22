export interface Database {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string
          user_id: string
          created_at: string
          status: 'pending' | 'processing' | 'completed' | 'failed'
          source: 'excel' | 'manual' | 'scraped'
          customer_website: string | null
          customer_name: string | null
          customer_email: string | null
          error_message: string | null
          generated_mail_subject: string | null
          generated_mail_body: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          source: 'excel' | 'manual' | 'scraped'
          customer_website?: string | null
          customer_name?: string | null
          customer_email?: string | null
          error_message?: string | null
          generated_mail_subject?: string | null
          generated_mail_body?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          source?: 'excel' | 'manual' | 'scraped'
          customer_website?: string | null
          customer_name?: string | null
          customer_email?: string | null
          error_message?: string | null
          generated_mail_subject?: string | null
          generated_mail_body?: string | null
        }
      }
      product_materials: {
        Row: {
          id: string
          user_id: string
          created_at: string
          file_name: string
          storage_path: string
          file_type: string | null
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          file_name: string
          storage_path: string
          file_type?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          file_name?: string
          storage_path?: string
          file_type?: string | null
        }
      }
    }
  }
}
