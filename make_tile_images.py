# -*- coding: utf-8 -*-
"""
Created on Tue Sep 22 11:42:43 2020

@author: balasubramanian
"""
import scipy.io as io
import numpy as np
from PIL import Image
import math
import os
import cv2
import matplotlib.pyplot as plt
#from sklearn.datasets.samples_generator import make_blobs
import json
#import tensorflow as tf
import sys, getopt
from skimage.transform import resize
from skimage.color import rgb2gray
from skimage import io
from matplotlib import cm

TRAJ_MERGE_DIR = 'D:\\Wurst\\Metric_Learning_Traffic_Scenarios\\data_merged_traj\\unique_200-100-ego\\'


def general_dataloader(dataset='cifar'):
    if dataset=='cifar':
        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.cifar10.load_data()
        X_train = X_train.transpose(0,3,1,2)
    elif dataset=='mnist':
        (X_train, y_train), (X_test, y_test) = tf.keras.datasets.mnist.load_data(path="mnist.npz")
        X_train = np.reshape(X_train,(X_train.shape[0],28,28,1))
        X_train = X_train.transpose(0,3,1,2)
    return X_train, y_train
        
def filelist_dataloader():    
    with open('python_input/file_list.json') as json_file:
        file_list = json.load(json_file)
    with open('python_input/embeddings_labels.json') as json_file:
        labels = json.load(json_file)
    
    XData = np.array( [resize(io.imread(fname),(64,64,3))*255 for fname in file_list] ).astype(np.uint8)
    return XData.transpose(0,3,1,2), labels

def custom_dataloader():
    with open('D:\\Wurst\\Metric_Learning_Traffic_Scenarios\\data_merged_traj\\unique_200-100-ego\\ego_list.json') as json_file:
        file_list = json.load(json_file)
    XData = np.array([resize(io.imread(file),(64,64,3))*255 for file in file_list] ).astype(np.uint8)
    #with open('D:\\Wurst\\Metric_Learning_Traffic_Scenarios\\Model\\results\\rand_random-excl-200-100-north-128_ResNet-1864_LSTM16_FC64-4_100_10_1\\umap_label.json') as json_file:
    #    labels = json.load(json_file)
    return XData.transpose(0,3,1,2),[]
    #return [],labels

def generate_tile(ss_width,image_height,image_width,Xin,data_dir):
    channel = Xin.shape[1]
    columns = math.floor(ss_width/image_width)
    rows =  math.floor(ss_width/image_height)
    nTiles = math.ceil(Xin.shape[0]/(rows*columns))
    
    
    if channel == 1:
        x_train =  Xin
        all_rows = []
        for i in range(x_train.shape[0]):
            if i % columns == 0:
                all_rows.append([])
            current = all_rows[len(all_rows) - 1]
            current.append(np.squeeze(x_train[i,:,:,:]))
        ranges = []
        for i in range(math.ceil(len(all_rows) / columns)):
            start = i * columns
            end = (i + 1) * columns
            if i == math.ceil(len(all_rows) / columns) - 1:
                end = len(all_rows)
            ranged = range(start, end)
            ranges.append(ranged)
            
        leftover = ss_width % columns
        row_padding = []
        for i in range(leftover):
            row_padding.append(0)

        chunk_padding = []
        for i in range(ss_width - columns * image_width):
            chunk_padding.append([])
            current = chunk_padding[len(chunk_padding) - 1]
            for p in range(ss_width):
                current.append(0)
               
        ss_width - len(ranges[0]) * image_width
        for range_counter in range(len(ranges)):
            full_combined = []
            for r in ranges[range_counter]:
                row_digits = all_rows[r]
                reshaped = []
                for i in range(len(row_digits)):
                    digit = row_digits[i]*255.0
                    digit = resize(digit,(image_width,image_height), anti_aliasing=False)
                    reshaped.append(digit)
                combined = []
                for i in range(image_height):
                    combined.append([])
                    current = combined[len(combined) - 1]
                    for j in range(len(row_digits)):
                        current.extend(reshaped[j][i])
                    padding_needed = ss_width - len(row_digits) * image_width
                    for p in range(padding_needed):
                        current.append(0)
                full_combined.extend(combined)
            row_padding_needed = ss_width - len(full_combined)
            wtf = row_padding_needed
            for rp in range(row_padding_needed):
                current = []
                for p in range(ss_width):
                    current.append(0)
                full_combined.append(current)
            test = full_combined
            rgba_combined = []
            for row in full_combined:
                rgba_combined.append([])
                current = rgba_combined[len(rgba_combined) - 1]
                for item in row:
                    current.append((item, item, item, 255))
            rgba_combined = np.asarray(rgba_combined)
            rgba_combined = rgba_combined.astype(np.uint8)
            im = Image.fromarray(np.asarray(rgba_combined), mode='RGBA')
            name = data_dir+'/tile_image_' + str(range_counter) + '.png'
            im.save(name)          
    else:
        chnl_combined = np.zeros((nTiles,ss_width,ss_width,channel+1))
        chnl_combined[:,:,:,3] = 255
        for chna in range(channel):
            x_train = Xin[:,chna,:,:]
            x_train = np.reshape(x_train,(x_train.shape[0],1,image_height,image_width))
            all_rows = []
            for i in range(x_train.shape[0]):
                if i % columns == 0:
                    all_rows.append([])
                current = all_rows[len(all_rows) - 1]
                current.append(np.squeeze(x_train[i,:,:,:]))
            ranges = []
            for i in range(math.ceil(len(all_rows) / columns)):
                start = i * columns
                end = (i + 1) * columns
                if i == math.ceil(len(all_rows) / columns) - 1:
                    end = len(all_rows)
                ranged = range(start, end)
                ranges.append(ranged) 
            ranges_row = []       
            for i in range(math.ceil(len(all_rows) / rows)):
                start = i * rows
                end = (i + 1) * rows
                if i == math.ceil(len(all_rows) / rows) - 1:
                    end = len(all_rows)
                ranged = range(start, end)
                ranges_row.append(ranged)    
                
            leftover = ss_width % columns    
            hunk_padding = []
            chunk_padding = []
            
            for i in range(ss_width - columns * image_width):
                chunk_padding.append([])
                current = chunk_padding[len(chunk_padding) - 1]
                for p in range(ss_width):
                    current.append(0)

            
            ss_width - len(ranges[0]) * image_width
            for range_counter in range(len(ranges_row)):
                full_combined = []
                for r in ranges_row[range_counter]:
                    row_digits = all_rows[r]
                    reshaped = []
                    for i in range(len(row_digits)):
                        digit = row_digits[i]
                        reshaped.append(digit)
                    combined = []
                    for i in range(image_height):
                        combined.append([])
                        current = combined[len(combined) - 1]
                        for j in range(len(row_digits)):
                            current.extend(reshaped[j][i])
                        padding_needed = ss_width - len(row_digits) * image_width
                        for p in range(padding_needed):
                            current.append(0)
                    full_combined.extend(combined)
                row_padding_needed = ss_width - len(full_combined)
                wtf = row_padding_needed
                for rp in range(row_padding_needed):
                    current = []
                    for p in range(ss_width):
                        current.append(0)
                    full_combined.append(current)
                test = full_combined
                rgba_combined = []
                for row in full_combined:
                    rgba_combined.append([])
                    current = rgba_combined[len(rgba_combined) - 1]
                    for item in row:
                        current.append((item))
                rgba_combined = np.asarray(rgba_combined)
                rgba_combined = rgba_combined.astype(np.uint8)
                chnl_combined[range_counter,:,:,chna] = rgba_combined
        for mm in range(nTiles):
            imgg = chnl_combined[mm,:,:,:]
            imgg = imgg.astype(np.uint8)
            im = Image.fromarray(np.asarray(imgg), mode='RGBA')
            name = data_dir+'/tile_image_' + str(mm) + '.png'
            im.save(name)
    return rows,columns,nTiles

def generate_setup(data_dir,image_width,image_height,ss_width,rows,columns,nTiles,embedding_names,labels,colormap_type):
    setup_dict = {
      "sprite_side_x": 64,
      "sprite_side_y": 64,
      "sprite_number": 4,
      "sprite_image_width": 64,
      "sprite_image_height": 64,
      "sprite_actual_size": 2048,
      "embedding_names": ["OSM UMAP Semi Super 50", "OSM UMAP Semi Mini 50","OSM UMAP Semi Super 50 Decoder","OSM UMAP Semi Mini 50 Decoder"],
      "embedding_number": 1,
      "color_array": [[68, 1, 84], [68, 2, 85], [68, 3, 87], [69, 5, 88], [69, 6, 90], [69, 8, 91], [70, 9, 92], [70, 11, 94], [70, 12, 95], [70, 14, 97], [71, 15, 98], [71, 17, 99], [71, 18, 101], [71, 20, 102], [71, 21, 103], [71, 22, 105], [71, 24, 106], [72, 25, 107], [72, 26, 108], [72, 28, 110], [72, 29, 111], [72, 30, 112], [72, 32, 113], [72, 33, 114], [72, 34, 115], [72, 35, 116], [71, 37, 117], [71, 38, 118], [71, 39, 119], [71, 40, 120], [71, 42, 121], [71, 43, 122], [71, 44, 123], [70, 45, 124], [70, 47, 124], [70, 48, 125], [70, 49, 126], [69, 50, 127], [69, 52, 127], [69, 53, 128], [69, 54, 129], [68, 55, 129], [68, 57, 130], [67, 58, 131], [67, 59, 131], [67, 60, 132], [66, 61, 132], [66, 62, 133], [66, 64, 133], [65, 65, 134], [65, 66, 134], [64, 68, 135], [63, 69, 135], [63, 71, 136], [62, 72, 136], [62, 73, 137], [61, 74, 137], [61, 75, 137], [61, 76, 137], [60, 77, 138], [60, 78, 138], [59, 80, 138], [59, 81, 138], [58, 82, 139], [58, 83, 139], [57, 84, 139], [57, 85, 139], [56, 86, 139], [56, 87, 140], [55, 88, 140], [55, 89, 140], [54, 90, 140], [54, 91, 140], [53, 92, 140], [53, 93, 140], [52, 94, 141], [52, 95, 141], [51, 96, 141], [51, 97, 141], [50, 98, 141], [50, 99, 141], [49, 100, 141], [49, 101, 141], [49, 102, 141], [48, 103, 141], [48, 104, 141], [47, 105, 141], [47, 106, 141], [46, 107, 142], [46, 108, 142], [46, 109, 142], [45, 110, 142], [45, 111, 142], [44, 112, 142], [44, 113, 142], [44, 114, 142], [43, 115, 142], [43, 116, 142], [42, 117, 142], [42, 118, 142], [42, 119, 142], [41, 121, 142], [40, 122, 142], [40, 122, 142], [40, 123, 142], [39, 124, 142], [39, 125, 142], [39, 126, 142], [38, 127, 142], [38, 128, 142], [38, 129, 142], [37, 130, 142], [37, 131, 141], [36, 132, 141], [36, 133, 141], [36, 134, 141], [35, 135, 141], [35, 136, 141], [35, 137, 141], [34, 137, 141], [34, 138, 141], [34, 139, 141], [33, 140, 141], [33, 141, 140], [33, 142, 140], [32, 143, 140], [32, 144, 140], [32, 145, 140], [31, 146, 140], [31, 147, 139], [31, 148, 139], [31, 149, 139], [31, 150, 139], [30, 151, 138], [30, 152, 138], [30, 153, 138], [30, 153, 138], [30, 154, 137], [30, 155, 137], [30, 156, 137], [30, 157, 136], [30, 158, 136], [30, 159, 136], [30, 160, 135], [31, 161, 135], [31, 162, 134], [31, 163, 134], [32, 164, 133], [32, 165, 133], [33, 166, 133], [33, 167, 132], [35, 168, 131], [35, 169, 130], [36, 170, 130], [37, 171, 129], [38, 172, 129], [39, 173, 128], [40, 174, 127], [41, 175, 127], [42, 176, 126], [43, 177, 125], [44, 177, 125], [46, 178, 124], [47, 179, 123], [48, 180, 122], [50, 181, 122], [51, 182, 121], [53, 183, 120], [54, 184, 119], [56, 185, 118], [57, 185, 118], [59, 186, 117], [61, 187, 116], [62, 188, 115], [64, 189, 114], [66, 190, 113], [68, 190, 112], [69, 191, 111], [71, 192, 110], [73, 193, 109], [75, 194, 108], [77, 194, 107], [79, 195, 105], [81, 196, 104], [83, 197, 103], [85, 198, 102], [87, 198, 101], [89, 199, 100], [91, 200, 98], [94, 201, 97], [96, 201, 96], [98, 202, 95], [100, 203, 93], [103, 204, 92], [105, 204, 91], [107, 205, 89], [109, 206, 88], [112, 206, 86], [114, 207, 85], [116, 208, 84], [119, 208, 82], [124, 210, 79], [126, 210, 78], [129, 211, 76], [131, 211, 75], [134, 212, 73], [136, 213, 71], [139, 213, 70], [141, 214, 68], [144, 214, 67], [146, 215, 65], [149, 215, 63], [151, 216, 62], [154, 216, 60], [157, 217, 58], [159, 217, 56], [162, 218, 55], [165, 218, 53], [167, 219, 51], [170, 219, 50], [173, 220, 48], [175, 220, 46], [178, 221, 44], [181, 221, 43], [183, 221, 41], [186, 222, 39], [189, 222, 38], [191, 223, 36], [194, 223, 34], [197, 223, 33], [199, 224, 31], [202, 224, 30], [205, 224, 29], [207, 225, 28], [210, 225, 27], [212, 225, 26], [215, 226, 25], [218, 226, 24], [220, 226, 24], [223, 227, 24], [225, 227, 24], [228, 227, 24], [231, 228, 25], [233, 228, 25], [236, 228, 26], [238, 229, 27], [241, 229, 28], [243, 229, 30], [246, 230, 31], [248, 230, 33], [250, 230, 34], [255, 0, 0]],
      "colored_images":0,
      "zoom_min":64,
      "zoom_mid":128,
      "zoom_max":256,
      "hoover_size":256
    }
    setup_dict["sprite_image_width"] = image_width
    setup_dict["sprite_image_height"] = image_height
    setup_dict["sprite_actual_size"] = ss_width
    setup_dict["sprite_side_y"] = rows
    setup_dict["sprite_side_x"] = columns
    setup_dict["sprite_number"] = nTiles
    setup_dict["embedding_names"] = embedding_names
    setup_dict["embedding_number"] = len(embedding_names)
    setup_dict["color_array"] = generate_color_map(colormap_type = colormap_type,labels=labels).tolist()
    #with open(data_dir+'\set_up.json', 'w') as fp:
    #    json.dump(setup_dict, fp)

def generate_color_map(colormap_type = 'viridis', labels=[]):
    print(min(labels),max(labels),np.unique(labels))
    unique_labels = np.unique(labels)
    colormap_type_fcn = cm.get_cmap(colormap_type,len(unique_labels))
    color_map = np.asarray(colormap_type_fcn(np.linspace(0,1,len(unique_labels)))*255).astype(np.uint8)
    color_map = color_map[:,0:3]
    print(color_map)
    return color_map

def main(argv):
    #TODO modify the image_height/width to your needs
    ss_width = 2048     # needs to be 2^n & > image_width > image_height
    image_height = 64   # needs to be 2^n
    image_width = 64    # needs to be 2^n
    # The Images will be rescaled to the given height and width
    data_dir = './dataTraj_unique_ego'
    embedding_names= ["ViT"]
    colormap_type = 'viridis'

    loader_type =1

    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    try:
        opts, args = getopt.getopt(argv,"gfc",["general","filelist","custom"])
    except getopt.GetoptError:
        sys.exit(2)
    for opt, arg in opts:
        if opt in ("-f", "--filelist"):
            loader_type = 0 
        elif opt in ("-c", "--custom"):
            loader_type = 1
        elif opt in ("-g", "--general"):
            loader_type = 2
    
    if loader_type==0:
        Xdata,ydata = filelist_dataloader()
        rows,columns,nTiles = generate_tile(ss_width,image_height,image_width,Xdata,data_dir)
        generate_setup(data_dir,image_width,image_height,ss_width,rows,columns,nTiles,embedding_names,ydata,colormap_type)
    elif loader_type==1:
        Xdata,ydata = custom_dataloader()
        #custom_dataloader()
        rows,columns,nTiles = generate_tile(ss_width,image_height,image_width,Xdata,data_dir)
        #rows= 32
        #columns=32
        #nTiles=98
        #ydata = [int(zws) for zws in ydata]
        #generate_setup(data_dir,image_width,image_height,ss_width,rows,columns,nTiles,embedding_names,ydata,colormap_type)
    elif loader_type==2:
        Xdata,ydata = general_dataloader(dataset='mnist')
        rows,columns,nTiles = generate_tile(ss_width,image_height,image_width,Xdata,data_dir)
        generate_setup(data_dir,image_width,image_height,ss_width,rows,columns,nTiles,embedding_names,ydata,colormap_type)
if __name__ == "__main__":
    main(sys.argv[1:])        