import { CldUploadWidget } from 'next-cloudinary';
import Image from 'next/image';
import React from 'react';
import { TbPhotoPlus } from 'react-icons/tb';

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface ImageUploadProps {
  onChange: (value: string) => void;
  value: string;
}

const ImageUpload = ({ onChange, value }: ImageUploadProps) => {
  const handleUpload = (result: any) => {
    alert('handleUpload called');
    console.log('Upload result;', result);
    if (result.evet === 'success') {
      onChange(result.info.secure_url);
    } else {
      console.error('Upload failed or incomplete', result);
    }
  };

  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return (
    <CldUploadWidget
      onUpload={handleUpload}
      uploadPreset={uploadPreset}
      options={{ maxFiles: 1, clientAllowedFormats: ['jpg', 'png', 'gif'] }}
    >
      {({ open }) => {
        return (
          <div
            onClick={() => open?.()}
            className='relative flex flex-col items-center justify-center gap-4 p-20 transition border-2 border-dashed cursor-pointer hover:opacity-70 border-neutral-300 text-neutral-300'
          >
            <TbPhotoPlus size={50} />
            {value && (
              <div className='absolute inset-0 w-full h-full'>
                <Image fill style={{ objectFit: 'cover' }} className='absolute inset-0' src={value} alt='' />
              </div>
            )}
          </div>
        );
      }}
    </CldUploadWidget>
  );
};

export default ImageUpload;
